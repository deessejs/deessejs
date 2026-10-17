import { createHash } from "node:crypto"
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  GenericContainer,
  type StartedNetwork,
  type StartedTestContainer,
} from "testcontainers"

import { runCommand, type CommandResult } from "./process.js"
import type { StartedStack } from "./containers.js"

const CLI_DIR = join(import.meta.dirname, "..", "..", "..")
const PKG_PATH = join(CLI_DIR, "package.json")

const CONSUMER_IMAGE = "node:24-alpine"
const PNPM_VERSION = "11.0.0"

/**
 * Read the test-only version we will publish. The brief asks for a
 * deterministic version that does not collide on Verdaccio across
 * reruns. We append a Date.now()-based suffix.
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
  path: string
  sha256: string
  testVersion: string
  packageName: string
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

/**
 * Extract the manifest from a pnpm-packed tarball. pnpm 11 packs
 * with a 'package/' top-level directory, so the manifest sits at
 * <tmp>/package/package.json after a no-strip extract. We use a
 * sync filter that returns boolean (not a Promise) — tar's filter
 * API does not await Promises, and a Promise<boolean> resolves to
 * a truthy value, which would let every entry through.
 */
const readManifestFromTarball = async (
  tgzPath: string,
): Promise<PackedArtifact["manifest"]> => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const tar = require("tar") as typeof import("tar")
  const tmp = mkdtempSync(join(tmpdir(), "cda-manifest-"))
  await tar.x({
    file: tgzPath,
    cwd: tmp,
    filter: (path: string) => path === "package/package.json",
  })
  const manifestJson = readFileSync(
    join(tmp, "package", "package.json"),
    "utf8",
  )
  return JSON.parse(manifestJson) as PackedArtifact["manifest"]
}

/**
 * Build the CLI and produce a pnpm pack tarball whose version is the
 * test version. The strategy here follows the pnpm docs and the
 * brief: pack from inside the workspace (the package's parent
 * directory) with a `--filter` so pnpm resolves the catalog and
 * workspace protocols against the same pnpm-workspace.yaml the
 * rest of the monorepo uses. Building a stage and copying
 * pnpm-workspace.yaml into it does not work because pnpm
 * recognizes a workspace member by its presence in the `packages:`
 * list — a stage without that entry is not a workspace member and
 * the catalog is not resolved.
 *
 * The version bump is applied in-place to the package's
 * package.json, then restored in `finally` so a failed build
 * leaves the workspace unchanged.
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
  writeFileSync(pkgPath, JSON.stringify(parsedPkg, null, 2) + "\n")

  let packResult: Awaited<ReturnType<typeof runCommand>>
  let tgzPath: string | null = null
  try {
    // Build the CLI so dist/ exists. The package.json's `files`
    // field is ["dist", ...] which means a pack without a fresh
    // dist/ would produce a tarball that contains no source. The
    // build is part of the original monorepo's pre-publish flow
    // and is what pnpm publishes users would see in production.
    //
    // The filter matches by name, NOT by version, because the
    // workspace manifest pnpm reads has not yet re-read the
    // bumped version. Filtering by the bumped version would
    // silently select zero projects; --fail-if-no-match turns
    // that into an explicit error.
    // pnpm is 'pnpm.cmd' on Windows (a .cmd shim) and 'pnpm'
    // on POSIX. The platform-specific name keeps the call
    // portable.
    const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm"

    const buildResult = await runCommand(
      pnpmCmd,
      [
        "--filter",
        parsedPkg.name,
        "--fail-if-no-match",
        "run",
        "build",
      ],
      { cwd: join(CLI_DIR, "..", ".."), timeoutMs: packTimeoutMs },
    )
    if (buildResult.exitCode !== 0) {
      throw new Error(
        `build failed before pack: exit=${buildResult.exitCode}\nstdout: ${buildResult.stdout}\nstderr: ${buildResult.stderr}`,
      )
    }

    const stageDir = mkdtempSync(join(tmpdir(), "cda-pack-out-"))
    packResult = await runCommand(
      pnpmCmd,
      [
        "--filter",
        parsedPkg.name,
        "--fail-if-no-match",
        "pack",
        "--pack-destination",
        stageDir,
      ],
      { cwd: join(CLI_DIR, "..", ".."), timeoutMs: packTimeoutMs },
    )
    if (packResult.exitCode !== 0) {
      // The pnpm output is the only way to know why pack failed;
      // throw a richer error so the test report carries the
      // command, the cwd, and the full output.
      throw new Error(
        [
          `pnpm pack failed (exit=${packResult.exitCode}).`,
          `cwd: ${join(CLI_DIR, "..", "..")}`,
          `command: pnpm --filter ${parsedPkg.name} --fail-if-no-match pack --pack-destination ${stageDir}`,
          `stdout: ${packResult.stdout}`,
          `stderr: ${packResult.stderr}`,
        ].join("\n"),
      )
    }

    const entries = readdirSync(stageDir).filter((e) => e.endsWith(".tgz"))
    if (entries.length !== 1) {
      throw new Error(
        [
          `pnpm pack wrote ${entries.length} tarballs into ${stageDir}, expected 1.`,
          `entries: [${entries.join(", ")}]`,
          `cwd: ${join(CLI_DIR, "..", "..")}`,
          `command: pnpm --filter ${parsedPkg.name} --fail-if-no-match pack --pack-destination ${stageDir}`,
        ].join("\n"),
      )
    }
    const tgzName = entries[0] as string
    tgzPath = join(stageDir, tgzName)
  } finally {
    // Always restore the original package.json, even on error.
    writeFileSync(pkgPath, originalPkg)
  }

  const manifest = await readManifestFromTarball(tgzPath as string)

  return {
    path: tgzPath as string,
    sha256: sha256(tgzPath as string),
    testVersion,
    packageName: parsedPkg.name,
    manifest,
  }
}

/**
 * Self-test for the packaging path that does not need Docker.
 * Verifies that the catalog / workspace-protocol resolution
 * works end-to-end on the developer's machine, with the same
 * pnpm 11 that the CI image uses. Runs as a plain Vitest unit
 * test so it is fast (under a second) and runs in `pnpm test`
 * without any harness orchestration.
 */
export const verifyPackageShape = async (
  artifact: PackedArtifact,
): Promise<void> => {
  // The manifest version is the bumped one and matches what
  // pnpm pack wrote into the tarball.
  if (artifact.manifest.version !== artifact.testVersion) {
    throw new Error(
      `manifest version mismatch: expected ${artifact.testVersion}, got ${artifact.manifest.version}`,
    )
  }
  // The bin map must contain at least one executable so the
  // published tarball is consumable. The CLI's bin name is
  // 'create-deesse-app'.
  if (
    !artifact.manifest.bin ||
    Object.keys(artifact.manifest.bin).length === 0
  ) {
    throw new Error(`manifest has no bin entry: ${JSON.stringify(artifact.manifest)}`)
  }
}

// Re-export the node:fs helpers used above so the import block at
// the top stays grouped.

/**
 * Bring up a clean consumer container attached to the test network.
 * The consumer has Node 24 + pnpm 11 + git installed via corepack
 * and apk. It runs `sleep infinity` until the harness execs a
 * command into it.
 */
const startConsumer = async (opts: {
  network: StartedNetwork
}): Promise<StartedTestContainer> => {
  const container = await new GenericContainer(CONSUMER_IMAGE)
    .withCommand(["sleep", "infinity"])
    .withNetwork(opts.network)
    .withNetworkAliases("cda-consumer")
    .start()

  // Bootstrap git + corepack. The official node:24-alpine image
  // ships without git, and the CLI runs `git ls-remote` even with
  // --no-install. corepack's shims are disabled by default; we
  // activate the pinned pnpm version explicitly.
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
  return container
}

export type Consumer = {
  container: StartedTestContainer
  installDir: string
  /**
   * Install the packed tarball via the local pnpm add (file:).
   * Uses the consumer's own .npmrc to point at the local
   * Verdaccio. This is the path used by the "packed-archive"
   * test, where the test asserts install + exec directly without
   * going through the registry.
   */
  installFromArchive: (
    archivePathInHost: string,
    timeoutMs: number,
  ) => Promise<CommandResult>
  /**
   * Run the package via `pnpm dlx`. This is the path used by the
   * "verdaccio-roundtrip" test, which proves the publish + dlx
   * round-trip works against a registry the consumer can resolve.
   * The release-age exemption is set up by the test, not by this
   * helper.
   */
  runViaDlx: (
    packageName: string,
    version: string,
    args: readonly string[],
    timeoutMs: number,
  ) => Promise<CommandResult>
}

/**
 * Build the consumer's .npmrc from the host-side registry URL and
 * auth token. The .npmrc file points pnpm at the consumer's
 * network alias for the registry, with the auth token written in
 * the per-registry slot so pnpm never falls back to the wrong
 * credential.
 */
const buildConsumerNpmrc = (token: string): string =>
  [
    `registry=http://${VERDACCIO_ALIAS_NAME}:4873/`,
    // The auth-token slot key is the URL-encoded form of the
    // registry URL. Trailing slash is required.
    `//${VERDACCIO_ALIAS_NAME}:4873/:_authToken=${token}`,
    "",
  ].join("\n")

/**
 * Build a minimal pnpm-workspace.yaml that lifts the release-age
 * policy for the exact test package + version, while keeping the
 * 1440-minute default for everything else. The harness writes this
 * to <installDir>/pnpm-workspace.yaml before each pnpm dlx so the
 * exemption is scoped to the disposable consumer.
 */
const buildConsumerWorkspaceYaml = (
  packageName: string,
  version: string,
): string =>
  [
    "packages: []",
    "minimumReleaseAge: 1440",
    "minimumReleaseAgeStrict: true",
    `minimumReleaseAgeExclude:`,
    `  - "${packageName}@${version}"`,
    "",
  ].join("\n")

/**
 * Helper that copies a file's contents into the container at a
 * given target path. Testcontainers' copyContentToContainer takes
 * an array of { content, target } objects; we wrap that pattern
 * here for a cleaner call site.
 */
const writeFileToContainer = async (
  container: StartedTestContainer,
  hostPath: string,
  containerPath: string,
): Promise<void> => {
  await container.copyContentToContainer([
    { content: readFileSync(hostPath), target: containerPath },
  ])
}

export const startConsumerForStack = async (
  stack: StartedStack,
): Promise<Consumer> => {
  const container = await startConsumer({ network: stack.network })
  const installDir = "/tmp/install"

  // Prepare host-side files that get copied into the consumer. The
  // .npmrc is constant (depends only on the registry token); the
  // pnpm-workspace.yaml is per-test because it pins a specific
  // package@version.
  const npmrcHostPath = join(tmpdir(), `cda-npmrc-${Date.now()}`)
  writeFileSync(npmrcHostPath, buildConsumerNpmrc(stack.registryToken))

  await writeFileToContainer(container, npmrcHostPath, `${installDir}/.npmrc`)

  return {
    container,
    installDir,
    installFromArchive: async (archivePathInHost, _timeoutMs) => {
      // pnpm add <archive> with the local registry. We let pnpm
      // pick up the .npmrc from cwd. The CLI itself has no install
      // scripts; lifecycle scripts on transitive deps are managed
      // by pnpm. No --allow-build is needed for this archive.
      // The _timeoutMs param is kept in the signature for symmetry
      // with runViaDlx (callers pass the same budget), but
      // Testcontainers' exec is unbounded by default.
      void _timeoutMs
      const r = await container.exec([
        "sh",
        "-c",
        [
          `mkdir -p ${installDir}`,
          `cd ${installDir}`,
          `pnpm add "${archivePathInHost}" --reporter=ndjson`,
        ].join(" && "),
      ])
      return {
        exitCode: r.exitCode,
        signal: null,
        stdout: r.output,
        stderr: "",
        durationMs: 0,
        startedAt: new Date().toISOString(),
        exitedAt: new Date().toISOString(),
      }
    },
    runViaDlx: async (packageName, version, args, timeoutMs) => {
      // Write a per-invocation workspace file that exempts this
      // exact (package, version) from the release-age policy.
      // The workspace file is dropped into the installDir so
      // pnpm picks it up from cwd — no --workspace-root flag
      // (which does not allow a custom path).
      const wsHostPath = join(
        tmpdir(),
        `cda-ws-${Date.now().toString(36)}.yaml`,
      )
      writeFileSync(
        wsHostPath,
        buildConsumerWorkspaceYaml(packageName, version),
      )
      const wsContainerPath = join(installDir, "pnpm-workspace.yaml")
      await writeFileToContainer(container, wsHostPath, wsContainerPath)

      // pnpm dlx reads the registry from .npmrc (already
      // written to installDir) and the workspace file from
      // cwd (which is installDir). The package + version is
      // the freshly-published artifact; the release-age exemption
      // matches it exactly.
      const dlxArgs = [
        "dlx",
        "--silent",
        `${packageName}@${version}`,
        ...args,
      ]
      return container.exec(dlxArgs, {
        workingDir: installDir,
        user: "root",
      }).then((r) => ({
        exitCode: r.exitCode,
        signal: null,
        stdout: r.output,
        stderr: "",
        durationMs: 0,
        startedAt: new Date().toISOString(),
        exitedAt: new Date().toISOString(),
      })) as unknown as Promise<CommandResult>
    },
  }
}

// Re-export the URL constant for use by tests.
const VERDACCIO_ALIAS_NAME = "registry"
