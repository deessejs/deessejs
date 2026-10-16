import { existsSync } from "node:fs"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import {
  packCli,
  readPackageName,
  readTestVersion,
  startConsumerForArchive,
} from "./support/consumer-stack.js"
import { startNetwork } from "./support/containers.js"
import { publishToVerdaccio } from "./support/verdaccio.js"

const dockerAvailable = (): boolean => {
  // Same gate as packed-archive.test.ts. Without a Docker daemon,
  // the journey cannot run. The Linux CI job guarantees Docker; the
  // Windows / macOS smoke jobs do not enter this file.
  return process.env.CDA_E2E_SKIP === undefined && existsSync("/var/run/docker.sock")
}

describe.skipIf(!dockerAvailable())(
  "create-deesse-app: verdaccio round-trip (commit 2.1)",
  () => {
    let testVersion: string
    let archive: Awaited<ReturnType<typeof packCli>>
    let stack: Awaited<ReturnType<typeof startNetwork>>
    let consumer: Awaited<ReturnType<typeof startConsumerForArchive>>

    beforeAll(async () => {
      testVersion = readTestVersion()
      archive = await packCli(testVersion)
      stack = await startNetwork()
      // The consumer is on the same network as the registry so it
      // can resolve the Verdaccio URL by alias.
      // startConsumerForArchive currently uses node:24-alpine with
      // no network; the greenfield here re-uses the consumer-stack
      // and re-attaches it to the testcontainers network. For
      // commit 2.1, we attach the existing consumer by using the
      // started container's underlying Docker network. The clean
      // solution is to extend startConsumerForArchive to accept a
      // network; for the first round we run the consumer with the
      // host registry URL. This is good enough to prove publish +
      // install + run, which is the acceptance criterion for 2.1.
      consumer = await startConsumerForArchive({
        registry: stack.registryHostUrl,
      })
    }, 10 * 60_000)

    afterAll(async () => {
      try {
        await consumer?.container.stop()
      } catch {
        // ignore
      }
      try {
        await stack?.stop()
      } catch {
        // ignore
      }
    }, 60_000)

    it("publishes the packed CLI to Verdaccio and pnpm dlx resolves the exact version", async () => {
      expect(archive.manifest.version).toBe(testVersion)
      expect(archive.manifest.name).toBe(readPackageName())

      // Publish from inside the consumer so the registry URL is
      // the one it will later resolve packages from.
      const publishResult = await publishToVerdaccio({
        consumer: consumer.container,
        registryUrl: stack.registryContainerUrl,
        artifact: archive,
      })
      expect(
        publishResult.exitCode,
        publishResult.stdout,
      ).toBe(0)
      // Verdaccio echoes the package name + version on success.
      expect(publishResult.stdout).toContain(archive.manifest.name)
      expect(publishResult.stdout).toContain(testVersion)

      // Now run the CLI via pnpm dlx from a clean working dir.
      // This exercises the registry resolution + executable
      // discovery — the same code path a real consumer would hit.
      const execResult = await consumer.container.exec([
        "sh",
        "-c",
        `cd /tmp && pnpm dlx ${readPackageName()}@${testVersion} --version`,
      ])
      expect(execResult.exitCode, execResult.output).toBe(0)
      // The CLI prints the manifest version (the build-time
      // CREATE_DEESSE_APP_VERSION is from the original package.json,
      // so the banner here is the original version, not the test
      // version). We only assert non-empty for now; the test
      // version was already asserted via the manifest above.
      expect(execResult.output.trim().length).toBeGreaterThan(0)
    }, 10 * 60_000)
  },
)
