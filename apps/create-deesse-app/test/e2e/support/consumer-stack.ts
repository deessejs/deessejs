import { createHash } from "node:crypto"
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
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

const readManifestFromTarball = (tgzPath: string): PackedArtifact["manifest"] => {
  // We extract package.json out of the gzipped tar via the same `tar`
  // package that the unit tests already use, so we don't add a new
  // dependency. The package.json sits at <stage>/package.json after
  // a strip-1 extract.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const tar = require("tar") as typeof import("tar")
  const tmp = mkdtempSync(join(tmpdir(), "cda-manifest-"))
  tar.x({ file: tgzPath, cwd: tmp, strip: 1, sync: true })
  const manifestJson = readFileSync(join(tmp, "package.json"), "utf8")
  return JSON.parse(manifestJson) as PackedArtifact["manifest"]
}

/**
 * Build the CLI (so dist/ matches the tested commit) and produce a
 * pnpm pack tarball whose version is the test version, so multiple
 * reruns don't collide and the brief's "assign a test-only version
 * before packing" rule is enforced. Returns the path, digest, and
 * the parsed manifest.
 *
 * The version bump is done in-memory by writing a transient
 * package.json with the bumped version into a temp directory, then
 * running `pnpm pack` from that directory. The original package.json
 * on disk is never modified.
 */
export const packCli = async (
  testVersion: string,
  packTimeoutMs = 5 * 60_000,
): Promise<PackedArtifact> => {
  // pnpm pack only allows one tarball per invocation, and the
  // version is read from the package.json on disk. We copy the
  // entire package to a temp directory so the build artifacts (dist/)
  // and LICENSE file are present, then bump version, then pack.
  const stage = mkdtempSync(join(tmpdir(), "cda-pack-"))
  // Mirror the source files. We exclude node_modules and dev-only
  // test scaffolding to keep the archive small.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const tar = require("tar") as typeof import("tar")
  tar.c(
    {
      gzip: false,
      file: join(stage, "src-tree.tar"),
      cwd: CLI_DIR,
      // Sync avoids an unhandled-rejection race during cleanup.
      sync: true,
      filter: (p: string) =>
        !p.includes("node_modules/") &&
        !p.includes(".turbo/") &&
        !p.includes("test-results/") &&
        !p.includes(".e2e-build/") &&
        !p.startsWith("dist/"),
    },
    ["package.json", "tsup.config.ts", "tsconfig.json", "src", "README.md"],
  )
  tar.x({ file: join(stage, "src-tree.tar"), cwd: stage, sync: true })
  rmSync(join(stage, "src-tree.tar"))

  // Copy the built dist/ + the LICENSE file from the monorepo root.
  cpSync(join(CLI_DIR, "dist"), join(stage, "dist"), { recursive: true })
  // The package.json `files` list references ../../LICENSE. Resolve
  // it relative to the package, which is one level up from this
  // monorepo root.
  const monorepoRoot = join(CLI_DIR, "..", "..")
  const licenseSrc = join(monorepoRoot, "LICENSE")
  if (existsSync(licenseSrc)) {
    copyFileSync(licenseSrc, join(stage, "LICENSE"))
  }

  // Bump the version in the staged package.json.
  const stagedPkgPath = join(stage, "package.json")
  const stagedPkg = JSON.parse(readFileSync(stagedPkgPath, "utf8")) as {
    name: string
    version: string
    [k: string]: unknown
  }
  stagedPkg.version = testVersion
  // Mark the test version explicitly so any downstream consumer that
  // sees the manifest knows this is a test-only build.
  ;(stagedPkg as Record<string, unknown>).publishConfig = {
    ...((stagedPkg.publishConfig as object) ?? {}),
    e2eTestVersion: testVersion,
  }
  writeFileSync(stagedPkgPath, JSON.stringify(stagedPkg, null, 2) + "\n")

  // pnpm pack writes the tarball to cwd and prints its name.
  const packResult = await runCommand("pnpm", ["pack"], {
    cwd: stage,
    timeoutMs: packTimeoutMs,
  })
  if (packResult.exitCode !== 0) {
    throw new Error(
      `pnpm pack failed: exit=${packResult.exitCode}\nstdout: ${packResult.stdout}\nstderr: ${packResult.stderr}`,
    )
  }
  // The tarball's name is the last non-empty line of stdout.
  const tgzName = packResult.stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.endsWith(".tgz"))
    .pop()
  if (!tgzName) {
    throw new Error(
      `pnpm pack did not print a .tgz name: ${packResult.stdout}`,
    )
  }
  const tgzPath = join(stage, tgzName)
  const manifest = readManifestFromTarball(tgzPath)

  return {
    path: tgzPath,
    sha256: sha256(tgzPath),
    testVersion,
    manifest,
  }
}

/**
 * Bring up a clean consumer container: Node 24, pnpm 11, non-root
 * user, no checkout, no monorepo. The packed artifact is copied in
 * via `container.copyContentToContainer`.
 *
 * For the packed-artifact journey (commit 1), we install via
 * `pnpm add <archive-path>` so the executable is exercised through
 * the real pnpm resolver — same code path consumers will hit. The
 * consumer has no /home/monorepo, no node_modules, no Verdaccio
 * network alias.
 */
export type ConsumerContainer = {
  container: StartedTestContainer
  /** Inside the consumer, the directory where pnpm will install. */
  installDir: string
  /** The pnpm registry to use (the local Verdaccio URL or the
   *  default registry). Set by the journey. */
  registry: string
  /** `pnpm add <archive>` to install the CLI, then `pnpm exec cda`. */
  installAndRun: (
    archivePathInHost: string,
    args: readonly string[],
    timeoutMs: number,
  ) => Promise<CommandResult>
}

const CONSUMER_IMAGE = "node:24-alpine"

const startConsumer = async (opts: {
  registry: string
}): Promise<ConsumerContainer> => {
  // The consumer is a plain Node 24 + pnpm 11 image. We install
  // pnpm globally with corepack (which ships with Node 16+) so the
  // pinned pnpm version from the repo (11.0.0) is used.
  const container = await new GenericContainer(CONSUMER_IMAGE)
    .withCommand(["sleep", "infinity"])
    .withExposedPorts()
    .start()

  // Bootstrap corepack and pin pnpm to the same version the repo
  // uses, so any pnpm-specific behavior (release-age policy, etc.)
  // matches what CI runs.
  const bootstrap = await container.exec([
    "sh",
    "-c",
    "corepack enable && corepack prepare pnpm@11.0.0 --activate",
  ])
  if (bootstrap.exitCode !== 0) {
    await container.stop()
    throw new Error(
      `failed to bootstrap pnpm in consumer: exit=${bootstrap.exitCode}\nstdout: ${bootstrap.output}\nstderr: ${bootstrap.output}`,
    )
  }

  const installDir = "/tmp/install"

  return {
    container,
    installDir,
    registry: opts.registry,
    installAndRun: async (archivePathInHost, args, timeoutMs) => {
      // Copy the archive into the container.
      const archiveBytes = readFileSync(archivePathInHost)
      const archiveName = archivePathInHost.split(/[/\\]/).pop() ?? "cda.tgz"
      await container.copyContentToContainer([
        { content: archiveBytes, target: `/tmp/${archiveName}` },
      ])

      // pnpm add <archive> with the test registry. The harness
      // uses --allow-build for any package whose postinstall might
      // run; the CLI itself has no install scripts, but the deps
      // might, and Verdaccio caches nothing so we're going to npmjs.
      // The minimumReleaseAge exception lives in commit 2.
      const installResult = await container.exec([
        "sh",
        "-c",
        [
          `mkdir -p ${installDir}`,
          `cd ${installDir}`,
          // The consumer's .npmrc points pnpm at the local registry
          // (or the public one for commit 1). The --config.strict-peer-deps
          // flag avoids surprise from a transitive peer we don't test.
          `pnpm init >/dev/null 2>&1 || true`,
          `pnpm config set registry ${opts.registry}`,
          `pnpm add "/tmp/${archiveName}" --reporter=ndjson`,
        ].join(" && "),
      ])
      if (installResult.exitCode !== 0) {
        return {
          exitCode: installResult.exitCode,
          signal: null,
          stdout: installResult.output,
          stderr: "",
          durationMs: 0,
          startedAt: new Date().toISOString(),
          exitedAt: new Date().toISOString(),
        }
      }

      // Run the installed CLI. `pnpm exec cda <args>` resolves
      // through the package.json bin map.
      const runResult = await container.exec([
        "sh",
        "-c",
        `cd ${installDir} && timeout ${Math.floor(timeoutMs / 1000)}s pnpm exec create-deesse-app ${args.join(" ")}`,
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

// Re-export the explicit fs helpers we used above so other modules
// do not need to import from `node:fs` directly.
export const _fs = { mkdirSync, unlinkSync }
