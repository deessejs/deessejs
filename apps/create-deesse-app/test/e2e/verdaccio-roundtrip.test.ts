import { existsSync } from "node:fs"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { startStack, type StartedStack } from "./support/containers.js"
import {
  packCli,
  readPackageName,
  readTestVersion,
  startConsumerForStack,
  type Consumer,
  type PackedArtifact,
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
    let archive: PackedArtifact | null = null

    beforeAll(async () => {
      testVersion = readTestVersion()
      packageName = readPackageName()
      archive = await packCli(testVersion)
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

    it(
      "publishes the packed CLI and pnpm dlx runs the exact version",
      async () => {
        if (!stack || !consumer || !archive) {
          throw new Error("stack/consumer/archive not started")
        }

        // Publish to Verdaccio. The artifact is the real
        // PackedArtifact (no 'as never' cast), with manifest
        // version, bin, and sha256 already populated.
        const publishResult = await publishToVerdaccio({
          consumer: consumer.container,
          installDir: consumer.installDir,
          registryUrl: stack.registryContainerUrl,
          artifact: archive,
        })
        expect(publishResult.exitCode, publishResult.stdout).toBe(0)
        expect(publishResult.stdout).toContain(packageName)
        expect(publishResult.stdout).toContain(testVersion)

        // pnpm dlx from the consumer with the release-age
        // exemption set up by startConsumerForStack. The output
        // dir is a sibling of installDir so the workspace
        // exemption does not leak into the project being generated.
        const execResult = await consumer.runViaDlx(
          packageName,
          testVersion,
          ["--version"],
          60_000
        )
        expect(execResult.exitCode, execResult.stdout).toBe(0)
        // --version banner is the tsup-inlined
        // CREATE_DEESSE_APP_VERSION, which is set from the bumped
        // package.json at build time. The build happens after the
        // version bump in packCli, so the banner matches the
        // bumped test version.
        expect(execResult.stdout.trim()).toBe(testVersion)
      },
      10 * 60_000
    )
  }
)
