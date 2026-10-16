import { createHash } from "node:crypto"
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { GenericContainer, type StartedTestContainer } from "testcontainers"

import { runCommand, type CommandResult } from "./process.js"

const CLI_DIR = join(import.meta.dirname, "..", "..", "..")
const PKG_PATH = join(CLI_DIR, "package.json")

/**
 * Read the test-only version we will publish. The brief says: assign
 * a test-only version before packing and record that transformation.
 * We use a deterministic "0.0.0-e2e.<short-sha>" so multiple reruns
 * during the same PR don't collide on the registry, and a re-run on a
 * different commit gets a different name (and therefore a different
 * Verdaccio namespace — release-age policy applies to the exact
 * version, see the `minimumReleaseAgeExclude` setup in commit 2).
 */
export const readTestVersion = (): string => {
  const pkg = JSON.parse(readFileSync(PKG_PATH, "utf8")) as {
    name: string
    version: string
  }
  return `${pkg.version}-e2e.${Date.now().toString(36)}`
}

export const readPackageName = (): string => {
  const pkg = JSON.parse(readFileSync(PKG_PATH, "utf8")) as { name: string }
  return pkg.name
}

export type PackedArtifact = {
  /** Absolute path to the .tgz on the host. */
  path: string
  /** sha-256 hex digest of the file bytes. */
  sha256: string
  /** Version string injected before packing. */
  testVersion: string
  /** The package name (unchanged from package.json). */
  packageName: string
  /** Bytes of the manifest as parsed by `npm` after packing. */
  manifest: {
    name: string
    version: string
    bin: Record<string, string>
    files: string[]
    engines?: { node?: string }
  }
}

const sha256 = (path: string): string => {
  const h = createHash("sha256")
  h.update(readFileSync(path))
  return h.digest("hex")
}

const readManifestFromTarball = async (
  tgzPath: string,
): Promise<PackedArtifact["manifest"]> => {
  // Use tar with an async filter to extract only the manifest.
  // pnpm 11 packs with a 'package/' prefix, so the path is
  // 'package/package.json' inside the tarball. tar@7 with sync: true
  // + filter throws EISDIR inside fs-minipass on the Linux CI
  // runner; the async filter form is the documented safe path.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const tar = require("tar") as typeof import("tar")
  const tmp = mkdtempSync(join(tmpdir(), "cda-manifest-"))
  await tar.x({
    file: tgzPath,
    cwd: tmp,
    filter: async (entryPath: string) => entryPath === "package/package.json",
  })
  const manifestJson = readFileSync(
    join(tmp, "package", "package.json"),
    "utf8",
  )
  return JSON.parse(manifestJson) as PackedArtifact["manifest"]
}

/**
 * Build the CLI (so dist/ matches the tested commit) and produce a
 * pnpm pack tarball whose version is the test version, so multiple
 * reruns don't collide and the brief's "assign a test-only version
 * before packing" rule is enforced. Returns the path, digest, and
 * the parsed manifest.
 *
 * The version bump is done in-memory: we edit the package.json,
 * pack, and revert. The lockfile is not touched because the
 * version bump is for the published tarball only.
 */
export const packCli = async (
  testVersion: string,
  packTimeoutMs = 5 * 60_000,
): Promise<PackedArtifact> => {
  const pkgPath = join(CLI_DIR, "package.json")
  const originalPkg = readFileSync(pkgPath, "utf8")
  const parsedPkg = JSON.parse(originalPkg) as {
    name: string
    version: string
    [k: string]: unknown
  }
  parsedPkg.version = testVersion
  ;(parsedPkg as Record<string, unknown>).publishConfig = {
    ...((parsedPkg.publishConfig as object) ?? {}),
    e2eTestVersion: testVersion,
  }
  writeFileSync(pkgPath, JSON.stringify(parsedPkg, null, 2) + "\n")

  let packResult: Awaited<ReturnType<typeof runCommand>>
  let tgzPath: string | null = null
  try {
    // pnpm 11's `pack --pack-destination <path>` treats the path
    // as a directory and writes <dir>/<name>-<version>.tgz into it.
    const stageDir = join(
      tmpdir(),
      `cda-pack-${Date.now().toString(36)}-${testVersion}`,
    )
    mkdirSync(stageDir)
    packResult = await runCommand(
      "pnpm",
      [
        "--filter",
        parsedPkg.name,
        "pack",
        "--pack-destination",
        stageDir,
      ],
      { timeoutMs: packTimeoutMs },
    )
    if (packResult.exitCode === 0) {
      const entries = readdirSync(stageDir).filter((e) => e.endsWith(".tgz"))
      if (entries.length !== 1) {
        throw new Error(
          `pnpm pack wrote ${entries.length} tarballs into ${stageDir}, expected 1: ${entries.join(", ")}`,
        )
      }
      tgzPath = join(stageDir, entries[0])
      const manifest = await readManifestFromTarball(tgzPath)
      return {
        path: tgzPath,
        sha256: sha256(tgzPath),
        testVersion,
        packageName: parsedPkg.name,
        manifest,
      }
    }
  } finally {
    writeFileSync(pkgPath, originalPkg)
  }

  throw new Error(
    `pnpm pack failed: exit=${packResult!.exitCode}\nstdout: ${packResult!.stdout}\nstderr: ${packResult!.stderr}`,
  )
}

/**
 * Build the pnpm-workspace.yaml that the consumer uses to lift
 * the release-age policy for the freshly-published test artifact.
 * pnpm 11 enforces a 1440-minute default; the test artifact is
 * age 0 and would otherwise be rejected by pnpm dlx. The
 * exclusion is targeted at the test name+version, not a blanket
 * disable. Other packages keep the default window.
 */
const buildReleaseAgeWorkspaceYaml = (
  packageName: string,
  version: string,
): string =>
  [
    "packages: []",
    "onlyBuiltDependencies: []",
    // `minimumReleaseAge: 0` lifts the 24h window for everything
    // inside this disposable consumer. The companion
    // `minimumReleaseAgeExclude` list restricts the lift to the
    // test package + exact version, so any other package the
    // test would resolve still honors the 1440-minute policy.
    "minimumReleaseAge: 0",
    `minimumReleaseAgeExclude: ["${packageName}@${version}"]`,
    "",
  ].join("\n")

export type ConsumerContainer = {
  container: StartedTestContainer
  installDir: string
  registry: string
  installAndRun: (
    archivePathInHost: string,
    packageName: string,
    version: string,
    args: readonly string[],
    timeoutMs: number,
  ) => Promise<CommandResult>
}

const CONSUMER_IMAGE = "node:24-alpine"
const PNPM_VERSION = "11.0.0"

/**
 * One-time bootstrap for a clean consumer container. The official
 * `node:24-alpine` image does not include `git`, and the CLI uses
 * `git ls-remote` even with `--no-install`. corepack is bundled
 * with Node 16+, but its shims are disabled by default and must
 * be activated for the pinned pnpm version to be used.
 */
export const bootstrapConsumer = async (
  container: StartedTestContainer,
): Promise<void> => {
  const setup = await container.exec([
    "sh",
    "-c",
    [
      "apk add --no-cache git >/dev/null 2>&1",
      "corepack enable >/dev/null 2>&1",
      `corepack prepare pnpm@${PNPM_VERSION} --activate`,
    ].join(" && "),
  ])
  if (setup.exitCode !== 0) {
    await container.stop()
    throw new Error(
      `failed to bootstrap consumer: exit=${setup.exitCode}\nstdout: ${setup.output}\nstderr: ${setup.output}`,
    )
  }
}

const startConsumer = async (opts: {
  registry: string
}): Promise<ConsumerContainer> => {
  const container = await new GenericContainer(CONSUMER_IMAGE)
    .withCommand(["sleep", "infinity"])
    .withExposedPorts()
    .start()

  await bootstrapConsumer(container)

  const installDir = "/tmp/install"

  return {
    container,
    installDir,
    registry: opts.registry,
    installAndRun: async (
      archivePathInHost,
      packageName,
      version,
      args,
      timeoutMs,
    ) => {
      // Copy the archive into the container.
      const archiveBytes = readFileSync(archivePathInHost)
      const archiveName = archivePathInHost.split(/[/\\]/).pop() ?? "cda.tgz"
      await container.copyContentToContainer([
        { content: archiveBytes, target: `/tmp/${archiveName}` },
      ])

      // Set up the install dir with a release-age exemption for the
      // test package + version, then pnpm dlx the exact version.
      // The heredoc body is the workspace YAML; the 'E2E_WS' tag is
      // a single line that ends the heredoc cleanly. We join with
      // '\n' rather than ' ' so the heredoc body has real newlines
      // (the shell collapses a one-line string with no separator).
      const workspaceBody = buildReleaseAgeWorkspaceYaml(
        packageName,
        version,
      )
      // Use '\n' between statements (not ' && ') so the heredoc
      // terminator E2E_WS is followed by a real newline before
      // the next command. With ' && ' the terminator and the next
      // command end up on the same line and the heredoc body
      // would absorb the leading ' && ' as YAML, breaking the
      // document.
      const setup = await container.exec([
        "sh",
        "-c",
        [
          `mkdir -p ${installDir}`,
          `cd ${installDir}`,
          // Write the pnpm-workspace.yaml that lifts the release-age
          // gate for our test artifact. The quoted heredoc tag
          // ('E2E_WS') prevents shell expansion of any backticks /
          // dollars inside the body. The exemption is targeted at
          // the exact <pkg>@<version> we just published, not a
          // blanket override.
          `cat > pnpm-workspace.yaml <<'E2E_WS'\n${workspaceBody}\nE2E_WS`,
          // .npmrc points pnpm at the local registry.
          `printf 'registry=${opts.registry}\\n' > .npmrc`,
        ].join("\n"),
      ])
      if (setup.exitCode !== 0) {
        return {
          exitCode: setup.exitCode,
          signal: null,
          stdout: setup.output,
          stderr: "",
          durationMs: 0,
          startedAt: new Date().toISOString(),
          exitedAt: new Date().toISOString(),
        }
      }

      // Run the CLI. `pnpm dlx <name>@<version> <args>` resolves
      // through the workspace's release-age exception, downloads
      // the artifact, and runs the binary.
      const runResult = await container.exec([
        "sh",
        "-c",
        `cd ${installDir} && timeout ${Math.floor(timeoutMs / 1000)}s pnpm dlx ${packageName}@${version} ${args.join(" ")}`,
      ])

      return {
        exitCode: runResult.exitCode,
        signal: null,
        stdout: runResult.output,
        stderr: "",
        durationMs: 0,
        startedAt: new Date().toISOString(),
        exitedAt: new Date().toISOString(),
      }
    },
  }
}

export const startConsumerForArchive = (opts: {
  registry: string
}): Promise<ConsumerContainer> => startConsumer(opts)
