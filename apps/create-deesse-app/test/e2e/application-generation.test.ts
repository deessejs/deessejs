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

/**
 * The consumer on the same Docker network as the registry can
 * resolve http://registry:4873/ and postgres:5432 by alias. The
 * CLI itself uses `git ls-remote` to find the template's
 * current SHA — that hits GitHub's public API, which we exercise
 * in real time.
 */
describe.skipIf(!dockerAvailable())(
  "create-deesse-app: application generation + structure",
  () => {
    let stack: StartedStack | null = null
    let consumer: Consumer | null = null
    let testVersion = ""
    let packageName = ""
    let archive: PackedArtifact | null = null
    let projectDir = ""

    beforeAll(async () => {
      testVersion = readTestVersion()
      packageName = readPackageName()
      const packed = await packCli(testVersion)
      archive = packed
      stack = await startStack()
      consumer = await startConsumerForStack(stack)
    }, 15 * 60_000)

    afterAll(async () => {
      try {
        await consumer?.container.stop()
      } catch (err) {
        console.warn(`[cda] cleanup: consumer.container.stop() failed:`, err)
      }
      try {
        await stack?.stop()
      } catch (err) {
        console.warn(`[cda] cleanup: stack.stop() failed:`, err)
      }
    }, 60_000)

    it("CLI runs pnpm dlx, generates a real Turborepo, and authenticates to PostgreSQL", async () => {
      if (!stack || !consumer || !archive) {
        throw new Error("stack/consumer/archive not started")
      }

      // Publish to Verdaccio. The host-built archive is copied
      // into the consumer's installDir by publishToVerdaccio,
      // which is where .npmrc lives and where pnpm publish
      // resolves the auth token.
      const publishResult = await publishToVerdaccio({
        consumer: consumer.container,
        installDir: consumer.installDir,
        registryUrl: stack.registryContainerUrl,
        artifact: archive,
      })
      expect(publishResult.exitCode, publishResult.stdout).toBe(0)
      expect(publishResult.stdout).toContain(packageName)
      expect(publishResult.stdout).toContain(testVersion)

      // The CLI runs from the installDir (where the registry
      // exemption and the .npmrc live). The output directory
      // --dir is a sibling of installDir so the consumer's
      // pnpm-workspace.yaml (with the test's release-age
      // exemption) does not leak into the project being
      // generated.
      projectDir = "/tmp/smoke-project"
      const workResult = await consumer.runViaDlx(
        packageName,
        testVersion,
        ["smoke-project", "--no-install", "--dir", projectDir],
        10 * 60_000,
      )
      expect(workResult.exitCode, workResult.stdout).toBe(0)
      // The CLI writes one JSON object to stdout, terminated by
      // a newline. We trim and parse directly; this avoids the
      // "find the JSON line in fused stdout" heuristic.
      const parsed = JSON.parse(workResult.stdout.trim()) as {
        ok: boolean
        projectCreated: boolean
        source: { repo: string; sha: string }
      }
      // Contract assertions: the JSON result must conform to the
      // documented schema. A test that only checks "stdout ends
      // with }" can pass with a stub JSON. These four fields are
      // the public contract.
      expect(parsed.ok).toBe(true)
      expect(parsed.projectCreated).toBe(true)
      expect(parsed.source.repo).toBe("deessejs/saas-template")
      expect(parsed.source.sha).toMatch(/^[0-9a-f]{40}$/)

      // The generated project is a real saas-template. The CLI's
      // --dir <path> is the FINAL destination, not a parent; the
      // project is created at <dir> directly, not <dir>/<name>.
      // Assert the structural contract the CLI promises: the
      // three apps (web/app/docs), the workspace file, and the
      // root package.json renamed to the project name. Checking
      // only that two files exist is not enough — a misnamed
      // rename or a missing app directory would pass that
      // gate and still produce an invalid project.
      const lsResult = await consumer.container.exec([
        "sh",
        "-c",
        `cd ${projectDir} && ls pnpm-workspace.yaml apps/web/package.json apps/app/package.json apps/docs/package.json packages/auth/package.json package.json`,
      ])
      expect(lsResult.exitCode, lsResult.output).toBe(0)
      for (const expected of [
        "pnpm-workspace.yaml",
        "apps/web/package.json",
        "apps/app/package.json",
        "apps/docs/package.json",
        "packages/auth/package.json",
        "package.json",
      ]) {
        expect(lsResult.output, `missing ${expected}`).toContain(expected)
      }

      // The root package.json must carry the project name the
      // user passed (`smoke-project`); this proves the rename
      // step ran end-to-end, not just that some package.json
      // exists.
      const readName = await consumer.container.exec([
        "sh",
        "-c",
        `cd ${projectDir} && node -e "console.log(require('./package.json').name)"`,
      ])
      expect(readName.exitCode, readName.output).toBe(0)
      expect(readName.stdout.trim()).toBe("smoke-project")

      // The consumer can authenticate to PostgreSQL with the
      // documented credentials. We send a real query through psql
      // rather than relying on pg_isready (which only checks the
      // server, not the credentials). A real SELECT proves both
      // network reachability and successful auth.
      const dbUrl = stack.postgresContainerUrl
      const authProbe = await consumer.container.exec([
        "sh",
        "-c",
        [
          // psql is not preinstalled on node:24-alpine; install it
          // first. The probe runs in a single shell so the install
          // cost is paid only on this test.
          "apk add --no-cache postgresql-client >/dev/null 2>&1",
          `psql '${dbUrl}' -c "SELECT current_database() || ' / ' || current_user;"`,
        ].join(" && "),
      ])
      expect(authProbe.exitCode, authProbe.output).toBe(0)
      expect(authProbe.output).toContain("cda_test_db")
      expect(authProbe.output).toContain("cda_test")
    }, 10 * 60_000)
  },
)
