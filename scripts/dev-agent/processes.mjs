import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

export function parseNodeEngine(engine) {
  if (typeof engine !== "string" || engine.length === 0) {
    throw new Error("package.json must declare engines.node.")
  }
  const majorRange = /^(\d+)\.x$/.exec(engine)
  if (majorRange) return { engine, major: Number(majorRange[1]), exact: null }

  const exactVersion = /^(\d+)\.(\d+)\.(\d+)$/.exec(engine)
  if (exactVersion) {
    return {
      engine,
      major: Number(exactVersion[1]),
      exact: engine,
    }
  }

  throw new Error(
    `Unsupported package.json engines.node value '${engine}'. Use a major range such as 24.x or an exact version.`
  )
}

export function readNodeEngine(root) {
  const manifestPath = path.join(root, "package.json")
  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
  } catch {
    throw new Error("Could not read the repository package.json Node.js pin.")
  }
  parseNodeEngine(manifest.engines?.node)
  return manifest.engines.node
}

export function nodeVersionMatches(version, engine) {
  const requirement = parseNodeEngine(engine)
  const match = /^(?:v)?(\d+)\.(\d+)\.(\d+)/.exec(version)
  if (!match) return false
  if (Number(match[1]) !== requirement.major) return false
  return (
    requirement.exact === null ||
    version.replace(/^v/, "") === requirement.exact
  )
}

export async function resolveNodeRuntimeArtifact(
  engine,
  platform,
  arch,
  fetchImpl = fetch
) {
  parseNodeEngine(engine)
  const artifact = nodeArchive(platform, arch)
  if (!artifact) {
    throw new Error(
      `No automatic Node.js runtime download is supported for ${platform}-${arch}. Install a runtime satisfying package.json engines.node (${engine}).`
    )
  }

  let index
  try {
    const response = await fetchImpl("https://nodejs.org/dist/index.json", {
      signal: AbortSignal.timeout(60_000),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    index = await response.json()
  } catch (error) {
    throw new Error(
      `Could not resolve a Node.js release for ${engine} from official Node.js metadata: ${error instanceof Error ? error.message : String(error)}.`
    )
  }

  const release = index
    .filter(
      (entry) =>
        /^v\d+\.\d+\.\d+$/.test(entry.version) &&
        nodeVersionMatches(entry.version, engine)
    )
    .sort((left, right) => compareNodeVersions(right.version, left.version))[0]
  if (!release) {
    throw new Error(
      `Official Node.js metadata contains no stable release satisfying package.json engines.node (${engine}).`
    )
  }
  const version = release.version.replace(/^v/, "")
  const archiveName = `node-v${version}-${artifact.platform}-${artifact.arch}.${artifact.extension}`
  if (!release.files?.includes(`${artifact.platform}-${artifact.arch}`)) {
    throw new Error(
      `Official Node.js release ${release.version} does not include ${artifact.platform}-${artifact.arch}.`
    )
  }
  let checksums
  try {
    const response = await fetchImpl(
      `https://nodejs.org/dist/${release.version}/SHASUMS256.txt`,
      { signal: AbortSignal.timeout(60_000) }
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    checksums = await response.text()
  } catch (error) {
    throw new Error(
      `Could not read the official Node.js SHASUMS256.txt for ${release.version}: ${error instanceof Error ? error.message : String(error)}.`
    )
  }
  const checksumLine = checksums
    .split(/\r?\n/)
    .find((line) => line.trim().split(/\s+/).at(-1) === archiveName)
  const sha256 = checksumLine?.trim().split(/\s+/)[0]
  if (!/^[a-f0-9]{64}$/i.test(sha256 ?? "")) {
    throw new Error(
      `The official Node.js checksum file has no valid SHA-256 entry for ${archiveName}.`
    )
  }
  return { version, sha256, archiveName }
}

function nodeArchive(platform, arch) {
  if (platform === "linux" && arch === "x64") {
    return { platform, arch, extension: "tar.xz" }
  }
  return null
}

function compareNodeVersions(left, right) {
  const a = left.replace(/^v/, "").split(".").map(Number)
  const b = right.replace(/^v/, "").split(".").map(Number)
  for (let index = 0; index < 3; index += 1) {
    if ((a[index] ?? 0) !== (b[index] ?? 0)) {
      return (a[index] ?? 0) - (b[index] ?? 0)
    }
  }
  return 0
}

async function installNodeRuntime({
  runtime,
  runtimeDirectory,
  nodePath,
  localDir,
  fetchImpl,
  spawnSyncImpl,
}) {
  if (existsSync(nodePath)) return
  const archivePath = path.join(
    localDir,
    `${runtime.archiveName}.${process.pid}.tmp`
  )
  const stagingDir = path.join(
    localDir,
    `node-v${runtime.version}-${process.pid}.tmp`
  )
  await downloadNodeArchive(runtime, archivePath, fetchImpl)
  extractNodeArchive(archivePath, stagingDir, spawnSyncImpl)
  moveNodeRuntime(stagingDir, runtimeDirectory, nodePath)
  process.stdout.write(
    `Installed checksum-verified Node.js ${runtime.version} under .local for this worktree.\n`
  )
}

async function downloadNodeArchive(runtime, archivePath, fetchImpl) {
  let response
  try {
    response = await fetchImpl(
      `https://nodejs.org/dist/v${runtime.version}/${runtime.archiveName}`,
      { signal: AbortSignal.timeout(60_000) }
    )
  } catch (error) {
    throw new Error(
      `Could not download the checksum-pinned local Node.js ${runtime.version} runtime: ${error instanceof Error ? error.message : String(error)}. Install a compatible runtime manually.`
    )
  }
  if (!response.ok) {
    throw new Error(
      `Node.js download returned HTTP ${response.status}. Install a compatible runtime manually.`
    )
  }
  const archive = Buffer.from(await response.arrayBuffer())
  const checksum = createHash("sha256").update(archive).digest("hex")
  if (checksum !== runtime.sha256) {
    throw new Error(
      "The Node.js archive checksum did not match the official SHA-256. The archive was not installed."
    )
  }
  writeFileSync(archivePath, archive, { mode: 0o600, flag: "wx" })
}

function extractNodeArchive(archivePath, stagingDir, spawnSyncImpl) {
  mkdirSync(stagingDir, { mode: 0o700 })
  const extracted = spawnSyncImpl(
    "tar",
    ["-xJf", archivePath, "--strip-components=1", "-C", stagingDir],
    { encoding: "utf8" }
  )
  unlinkSync(archivePath)
  if (extracted.error || extracted.status !== 0) {
    rmSync(stagingDir, { recursive: true, force: true })
    throw new Error(
      `Could not extract the local Node.js runtime: ${extracted.stderr?.trim() || extracted.error?.message || "tar failed"}. Install xz and tar, or select a compatible runtime manually.`
    )
  }
}

function moveNodeRuntime(stagingDir, runtimeDirectory, nodePath) {
  try {
    renameSync(stagingDir, runtimeDirectory)
  } catch (error) {
    rmSync(stagingDir, { recursive: true, force: true })
    if (!existsSync(nodePath)) {
      throw new Error(
        `Could not install the worktree-local Node.js runtime: ${error instanceof Error ? error.message : String(error)}.`
      )
    }
  }
}

export async function ensureNodeRuntime({
  root,
  localDir,
  argv,
  environment,
  currentVersion = process.versions.node,
  platform = process.platform,
  arch = process.arch,
  fetchImpl = fetch,
  spawnSyncImpl = spawnSync,
}) {
  const engine = readNodeEngine(root)
  parseNodeEngine(engine)
  if (nodeVersionMatches(currentVersion, engine)) return

  const runtime = await resolveNodeRuntimeArtifact(
    engine,
    platform,
    arch,
    fetchImpl
  )
  const runtimeDirectory = path.join(
    localDir,
    `node-v${runtime.version}-${platform}-${arch}`
  )
  const nodePath = path.join(runtimeDirectory, "bin", "node")
  if (platform !== "linux" || arch !== "x64") {
    throw new Error(
      `Node.js ${currentVersion} does not satisfy package.json engines.node (${engine}). Install a compatible Node.js runtime manually.`
    )
  }

  mkdirSync(localDir, { recursive: true, mode: 0o700 })
  chmodSync(localDir, 0o700)
  await installNodeRuntime({
    runtime,
    runtimeDirectory,
    nodePath,
    localDir,
    fetchImpl,
    spawnSyncImpl,
  })

  const version = spawnSyncImpl(nodePath, ["--version"], {
    encoding: "utf8",
  })
  if (
    version.error ||
    version.status !== 0 ||
    !nodeVersionMatches(version.stdout.trim(), engine)
  ) {
    throw new Error(
      "The worktree-local Node.js runtime is invalid. Inspect the .local runtime before removing it."
    )
  }
  const child = spawnSyncImpl(
    nodePath,
    [fileURLToPath(new URL("../dev-agent.mjs", import.meta.url)), ...argv],
    {
      cwd: root,
      env: {
        ...environment,
        PATH: `${path.dirname(nodePath)}:${environment.PATH ?? ""}`,
      },
      stdio: "inherit",
    }
  )
  process.exit(child.status ?? 1)
}
