import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
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
 * test version. The version bump happens in a temp staging
 * directory so the workspace's package.json is never mutated on
 * disk. The build is run before the bump so dist/ matches the
 * pre-bump source — we accept this trade-off because the CLI's
 * --version banner is the build-time value and the brief explicitly
 * accepts asserting on the manifest version instead.
 */
export const packCli = async (
  testVersion: string,
  packTimeoutMs = 5 * 60_000,
): Promise<PackedArtifact> => {
  // Stage the package in a tmp directory that mirrors the monorepo's
  // relevant files, so 'pnpm --filter <name> pack' resolves the
  // workspace catalog.
  const stage = mkdtempSync(join(tmpdir(), "cda-pack-"))
  const cliStage = join(stage, "apps", "create-deesse-app")
  mkdirSync(cliStage, { recursive: true })

  // Copy the relevant source files. We do not include node_modules
  // (not present anyway) or test/ (we only need the publishable
  // source).
  cpSync(join(CLI_DIR, "package.json"), join(cliStage, "package.json"))
  cpSync(join(CLI_DIR, "tsup.config.ts"), join(cliStage, "tsup.config.ts"))
  cpSync(join(CLI_DIR, "tsconfig.json"), join(cliStage, "tsconfig.json"))
  cpSync(join(CLI_DIR, "src"), join(cliStage, "src"), { recursive: true })
  cpSync(join(CLI_DIR, "dist"), join(cliStage, "dist"), { recursive: true })
  cpSync(join(CLI_DIR, "README.md"), join(cliStage, "README.md"))
  // Copy the monorepo's pnpm-workspace.yaml so the stage can
  // resolve any 'catalog:' references in the package's
  // dependencies / devDependencies. Without this file, pnpm 11
  // refuses to pack the stage because the catalog is not
  // discoverable.
  cpSync(
    join(CLI_DIR, "..", "..", "pnpm-workspace.yaml"),
    join(stage, "pnpm-workspace.yaml"),
  )
  // License at the monorepo root.
  const monorepoRoot = join(CLI_DIR, "..", "..")
  const licenseSrc = join(monorepoRoot, "LICENSE")
  if (existsSync(licenseSrc)) {
    cpSync(licenseSrc, join(cliStage, "LICENSE"))
  }

  // Bump the version in the staged package.json. The catalog
  // references are resolved by pnpm against the workspace file
  // we just copied. The workspace-protocol devDependencies
  // (@workspace/eslint-config, @workspace/typescript-config) are
  // not present as installed packages, so we replace them with
  // plain semver taken from the same catalog.
  const stagedPkgPath = join(cliStage, "package.json")
  const stagedPkg = JSON.parse(readFileSync(stagedPkgPath, "utf8")) as {
    name: string
    version: string
    devDependencies?: Record<string, string>
    [k: string]: unknown
  }
  stagedPkg.version = testVersion
  if (stagedPkg.devDependencies) {
    stagedPkg.devDependencies = Object.fromEntries(
      Object.entries(stagedPkg.devDependencies).map(([k, v]) => [
        k,
        v === "workspace:*" ? "*" : v,
      ]),
    ) as Record<string, string>
  }
  writeFileSync(stagedPkgPath, JSON.stringify(stagedPkg, null, 2) + "\n")

  // pnpm pack writes into a destination directory. We use a fresh
  // tmpdir and locate the produced tarball by glob. We run pnpm
  // pack from the stage's package directory (not via --filter)
  // because pnpm's --filter syntax doesn't reliably match a
  // versioned spec in a non-workspace context.
  const stageDir = mkdtempSync(join(tmpdir(), "cda-pack-out-"))
  const packResult = await runCommand(
    "pnpm",
    ["pack", "--pack-destination", stageDir],
    { cwd: cliStage, timeoutMs: packTimeoutMs },
  )
  if (packResult.exitCode !== 0) {
    throw new Error(
      `pnpm pack failed: exit=${packResult.exitCode}\nstdout: ${packResult.stdout}\nstderr: ${packResult.stderr}`,
    )
  }

  const entries = readdirSync(stageDir).filter((e) => e.endsWith(".tgz"))
  if (entries.length !== 1) {
    throw new Error(
      `pnpm pack wrote ${entries.length} tarballs into ${stageDir}, expected 1: ${entries.join(", ")}`,
    )
  }
  const tgzName = entries[0] as string
  const tgzPath = join(stageDir, tgzName)
  const manifest = await readManifestFromTarball(tgzPath)

  return {
    path: tgzPath,
    sha256: sha256(tgzPath),
    testVersion,
    packageName: stagedPkg.name,
    manifest,
  }
}

// Re-export the node:fs helpers used above so the import block at
// the top stays grouped.
import { cpSync, existsSync } from "node:fs"

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
    // Even if the test pins minimumReleaseAge to a sane default in
    // pnpm-workspace.yaml, be explicit at the .npmrc level so a
    // future test that forgets the workspace exemption still works
    // for the freshly-published artifact.
    "minimum-release-age=0",
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
      // pnpm-workspace.yaml is a sibling of the install dir so the
      // generated app's installation (in a different dir) does not
      // inherit the test's exemption.
      const wsHostPath = join(
        tmpdir(),
        `cda-ws-${Date.now().toString(36)}.yaml`,
      )
      writeFileSync(
        wsHostPath,
        buildConsumerWorkspaceYaml(packageName, version),
      )
      const wsContainerPath = `/tmp/cda-ws-${Date.now().toString(36)}.yaml`
      await writeFileToContainer(container, wsHostPath, wsContainerPath)

      return container.exec([
        "sh",
        "-c",
        [
          `cd ${installDir}`,
          // pnpm dlx reads the registry from .npmrc (already
          // written). The pnpm-workspace.yaml is in cwd because
          // pnpm's dlx-config inheritance only sees files in the
          // invocation directory or a parent. We pass the workspace
          // path via --workspace-root so pnpm picks it up without
          // polluting the install dir.
          `timeout ${Math.floor(timeoutMs / 1000)}s pnpm dlx --workspace-root ${wsContainerPath} ${packageName}@${version} ${args.join(" ")}`,
        ].join(" && "),
      ]).then((r) => ({
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
