import { existsSync } from "node:fs"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { startStack, type StartedStack } from "./support/containers.js"
import {
  packCli,
  readPackageName,
  readTestVersion,
  startConsumerForStack,
  type Consumer,
} from "./support/consumer-stack.js"
import { publishToVerdaccio } from "./support/verdaccio.js"

const dockerAvailable = (): boolean =>
  process.env.CDA_E2E_SKIP === undefined && existsSync("/var/run/docker.sock")

describe.skipIf(!dockerAvailable())(
  "create-deesse-app: verdaccio round-trip",
  () => {
    let stack: StartedStack | null = null
    let consumer: Consumer | null = null
    let testVersion = ""
    let packageName = ""
    let archivePath = ""

    beforeAll(async () => {
      testVersion = readTestVersion()
      packageName = readPackageName()
      const archive = await packCli(testVersion)
      archivePath = archive.path
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

    it("publishes the packed CLI and pnpm dlx runs the exact version", async () => {
      if (!stack || !consumer) throw new Error("stack/consumer not started")

      // Publish from the consumer so the registry URL is the
      // network alias (registry:4873) rather than the host.
      // The token is the one created by startStack.
      const publishResult = await publishToVerdaccio({
        consumer: consumer.container,
        registryUrl: stack.registryContainerUrl,
        registryToken: stack.registryToken,
        registryUser: stack.registryUser,
        artifact: { path: archivePath } as never,
      })
      expect(publishResult.exitCode, publishResult.stdout).toBe(0)
      expect(publishResult.stdout).toContain(packageName)
      expect(publishResult.stdout).toContain(testVersion)

      // pnpm dlx from the consumer with the release-age
      // exemption set up by startConsumerForStack.
      const execResult = await consumer.runViaDlx(
        packageName,
        testVersion,
        ["--version"],
        60_000,
      )
      expect(execResult.exitCode, execResult.stdout).toBe(0)
      expect(execResult.stdout.trim().length).toBeGreaterThan(0)
    }, 10 * 60_000)
  },
)
