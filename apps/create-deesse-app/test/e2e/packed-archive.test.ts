import { existsSync, readFileSync } from "node:fs"

import { describe } from "vitest"

import { test, expect } from "./support/fixtures.js"
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
    test("manifest reports the bumped test version and an installable bin", async ({ stack }) => {
      const testVersion = readTestVersion()
      const packageName = readPackageName()
      const archive = await packCli(testVersion)
      // Start the consumer so the second test below has it; the
      // fixture tears it down on exit.
      await startConsumerForStack(stack)

      // The manifest comes from packCli (already parsed from the
      // tarball). We re-assert its fields here so the test is
      // self-contained and reads as a single spec.
      expect(packageName).toMatch(/^@?[a-z0-9][a-z0-9._-]*$/)
      expect(archive.manifest.version).toBe(testVersion)
    })

    test("installs the archive in the consumer and --version returns the bumped test version", async ({ stack }) => {
      const testVersion = readTestVersion()
      const archive = await packCli(testVersion)
      const consumer: Consumer = await startConsumerForStack(stack)

      const archiveName = archive.path.split(/[/\\]/).pop() ?? "cda.tgz"
      await consumer.container.copyContentToContainer([
        {
          content: readFileSync(archive.path),
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
      // Now that packCli runs the build against the bumped
      // package.json (the build step happens after the version
      // bump, before the pack), the tsup-inlined
      // CREATE_DEESSE_APP_VERSION env var carries the test
      // version into the bundle. The --version banner must
      // therefore match the bumped version exactly.
      expect(versionResult.stdout.trim()).toBe(testVersion)
    }, 10 * 60_000)
  },
)
