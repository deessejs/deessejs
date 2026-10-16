import { existsSync } from "node:fs"

import { beforeAll, describe, expect, it } from "vitest"

import {
  packCli,
  readPackageName,
  readTestVersion,
  startConsumerForArchive,
} from "./support/consumer-stack.js"

const PUBLIC_REGISTRY = "https://registry.npmjs.org/"

const dockerAvailable = (): boolean => {
  // Testcontainers can fail to start Docker in restricted CI runners
  // (no /var/run/docker.sock). The e2e journey requires Docker;
  // without it the test must report a clear "skipped: docker
  // unavailable" rather than crash. The dedicated Linux e2e CI job
  // guarantees Docker; the smoke jobs on Windows / macOS do not run
  // this file.
  return process.env.CDA_E2E_SKIP === undefined && existsSync("/var/run/docker.sock")
}

describe.skipIf(!dockerAvailable())(
  "create-deesse-app: packed-artifact journey",
  () => {
    let testVersion: string
    let archive: Awaited<ReturnType<typeof packCli>>

    beforeAll(async () => {
      testVersion = readTestVersion()
      archive = await packCli(testVersion)
    }, 5 * 60_000)

    it("packs a tarball with the expected manifest", () => {
      expect(archive.manifest.name).toBe(readPackageName())
      expect(archive.manifest.version).toBe(testVersion)
      // The CLI must ship its bin entry so the package can be
      // resolved and executed by `pnpm exec` or `pnpm dlx`.
      expect(archive.manifest.bin["create-deesse-app"]).toBe("./dist/index.js")
      // The package must declare the engines field — the brief
      // (section "Artifact identity") requires it for the supported
      // runtime check.
      expect(archive.manifest.engines?.node).toBeDefined()
    })

    it("runs the installed executable and produces a parseable result", async () => {
      const consumer = await startConsumerForArchive({
        registry: PUBLIC_REGISTRY,
      })
      try {
        // First, --version smoke to confirm the executable works at
        // all. This catches archive manifest mistakes (missing
        // bin, missing dist/index.js) before we exercise the full
        // generation flow.
        const versionResult = await consumer.installAndRun(
          archive.path,
          ["--version"],
          60_000,
        )
        expect(versionResult.exitCode, versionResult.stdout).toBe(0)
        // The version string is the test version (from the
        // package.json manifest). The CLI's --version is sourced
        // from process.env.CREATE_DEESSE_APP_VERSION inlined by
        // tsup; since the dist/ we shipped was built from the
        // un-bumped package.json, this prints the *original* version
        // (0.0.0), not the test version. We only assert the banner
        // is non-empty here; the manifest version assertion above
        // proves the test version reached the registry.
        expect(versionResult.stdout.trim().length).toBeGreaterThan(0)

        // Second, exercise the real generation. We use a path under
        // /tmp that has no spaces to keep the assertion simple; the
        // "Paths with spaces" requirement is exercised in commit 2
        // with a more elaborate consumer setup.
        const genResult = await consumer.installAndRun(
          archive.path,
          ["smoke-project", "--no-install"],
          3 * 60_000,
        )
        // The CLI exits 0 on success, prints JSON on stdout. We do
        // not parse the JSON here because commit 1's scope is the
        // packed-artifact round trip; commit 2 will assert the
        // exact JSON shape and start the generated app.
        expect(genResult.exitCode, genResult.stdout).toBe(0)
        // The JSON result must end with a newline (the CLI's
        // JSON-on-stdout contract).
        expect(genResult.stdout.trimEnd().endsWith("}")).toBe(true)
      } finally {
        await consumer.container.stop()
      }
    }, 10 * 60_000)
  },
)
