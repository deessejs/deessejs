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
    let archivePath = ""
    let projectDir = ""

    beforeAll(async () => {
      testVersion = readTestVersion()
      packageName = readPackageName()
      const archive = await packCli(testVersion)
      archivePath = archive.path
      stack = await startStack()
      consumer = await startConsumerForStack(stack)
    }, 15 * 60_000)

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

    it("CLI runs pnpm dlx, generates a real Turborepo, and authenticates to PostgreSQL", async () => {
      if (!stack || !consumer) throw new Error("stack/consumer not started")

      // Publish to Verdaccio (registry on the test network).
      const { publishToVerdaccio } = await import("./support/verdaccio.js")
      const publishResult = await publishToVerdaccio({
        consumer: consumer.container,
        registryUrl: stack.registryContainerUrl,
        registryToken: stack.registryToken,
        registryUser: stack.registryUser,
        artifact: { path: archivePath } as never,
      })
      expect(publishResult.exitCode, publishResult.stdout).toBe(0)

      // Run the CLI in a fresh, sibling directory of the install
      // dir so the registry exemption in <installDir>/pnpm-workspace.yaml
      // does not apply to the project being generated.
      projectDir = "/tmp/smoke-project"
      const workResult = await consumer.container.exec([
        "sh",
        "-c",
        `mkdir -p ${projectDir} && cd ${projectDir} && pnpm dlx --silent ${packageName}@${testVersion} smoke-project --no-install`,
      ])
      expect(workResult.exitCode, workResult.output).toBe(0)
      // Parse the full JSON output (not a substring search). The
      // CLI writes one JSON object to stdout, terminated by a
      // newline. We split on newlines and take the last non-empty
      // line that starts with '{' and ends with '}'.
      const stdoutLines = workResult.output
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
      const jsonLine = stdoutLines.reverse().find((l) => l.startsWith("{"))
      if (!jsonLine) {
        throw new Error(
          `no JSON line in CLI stdout: ${workResult.output}`,
        )
      }
      const parsed = JSON.parse(jsonLine) as {
        ok: boolean
        projectCreated: boolean
        source: { repo: string; sha: string }
      }
      expect(parsed.ok).toBe(true)
      expect(parsed.projectCreated).toBe(true)
      expect(parsed.source.repo).toBe("deessejs/saas-template")
      expect(parsed.source.sha).toMatch(/^[0-9a-f]{40}$/)

      // The generated project is a real Turborepo.
      const lsResult = await consumer.container.exec([
        "sh",
        "-c",
        `cd ${projectDir}/smoke-project && ls -la pnpm-workspace.yaml apps/app/package.json`,
      ])
      expect(lsResult.exitCode, lsResult.output).toBe(0)
      expect(lsResult.output).toContain("pnpm-workspace.yaml")
      expect(lsResult.output).toContain("apps/app/package.json")

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
      // The output looks like:
      //   current_database() | current_user
      //   -------------------+-------------
      //    cda_test_db        | cda_test
      // The single-row, single-column query returns the values
      // concatenated. We assert both names appear.
      expect(authProbe.output).toContain("cda_test_db")
      expect(authProbe.output).toContain("cda_test")
    }, 10 * 60_000)
  },
)
