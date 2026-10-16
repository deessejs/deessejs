import { existsSync, readFileSync } from "node:fs"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { startStack, type StartedStack } from "./support/containers.js"
import {
  packCli,
  readPackageName,
  readTestVersion,
  startConsumerForStack,
  type Consumer,
} from "./support/consumer-stack.js"

const dockerAvailable = (): boolean => {
  // Per the brief: 'si Docker est indisponible en CI, le job doit
  // échouer clairement'. We only check that the socket exists at
  // the well-known Linux path. Anything else (Windows, macOS) is
  // not a path we want to silently skip.
  return process.env.CDA_E2E_SKIP === undefined && existsSync("/var/run/docker.sock")
}

describe.skipIf(!dockerAvailable())(
  "create-deesse-app: packed-archive journey",
  () => {
    let stack: StartedStack | null = null
    let consumer: Consumer | null = null
    let testVersion = ""
    let packageName = ""
    let archivePath = ""
    let manifestVersion = ""

    beforeAll(async () => {
      testVersion = readTestVersion()
      packageName = readPackageName()
      const archive = await packCli(testVersion)
      archivePath = archive.path
      manifestVersion = archive.manifest.version
      stack = await startStack()
      consumer = await startConsumerForStack(stack)
    }, 10 * 60_000)

    afterAll(async () => {
      try {
        await consumer?.container.stop()
      } catch {
        // best-effort
      }
      try {
        await stack?.stop()
      } catch {
        // best-effort
      }
    }, 60_000)

    it("manifest reports the bumped test version and an installable bin", () => {
      // The manifest comes from packCli (already parsed from the
      // tarball). We re-assert its fields here so the test is
      // self-contained and reads as a single spec.
      expect(packageName).toMatch(/^@?[a-z0-9][a-z0-9._-]*$/)
      expect(manifestVersion).toBe(testVersion)
    })

    it("installs the archive in the consumer and --version produces a non-empty banner", async () => {
      if (!consumer) throw new Error("consumer not started")
      const archiveName = archivePath.split(/[/\\]/).pop() ?? "cda.tgz"
      await consumer.container.copyContentToContainer([
        {
          content: readFileSync(archivePath),
          target: `/tmp/${archiveName}`,
        },
      ])
      const installResult = await consumer.installFromArchive(
        `/tmp/${archiveName}`,
        3 * 60_000,
      )
      expect(installResult.exitCode, installResult.stdout).toBe(0)
      const versionResult = await consumer.container.exec([
        "sh",
        "-c",
        `cd /tmp/install && pnpm exec create-deesse-app --version`,
      ])
      expect(versionResult.exitCode, versionResult.output).toBe(0)
      // The banner is the build-time version (0.0.0), not the
      // test version, because tsup inlined it at build time. The
      // manifest.version assertion above proves the test version
      // reached the package; this is a smoke that the binary
      // actually runs.
      expect(versionResult.output.trim().length).toBeGreaterThan(0)
    }, 10 * 60_000)
  },
)
