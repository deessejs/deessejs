import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { startMockServer, type MockServerHandle } from "./helpers/mock-server.js"
import { run } from "./helpers/cli-runner.js"

/**
 * e2e suite for the `list` command.
 *
 * The CLI binary is invoked from the published tarball against a
 * mock HTTP server. The mock server is bound to 127.0.0.1 on a
 * random free port. The CLI's API_BASE_URL env var is set to the
 * mock server's URL.
 *
 * Implements ADR-014.
 */

const SAAS_STARTER = {
  slug: "saas-starter",
  name: "SaaS Starter",
  description: "Production-ready Next.js + Better Auth + Postgres boilerplate for B2B SaaS.",
  owner: "deessejs",
  repo: "saas-template",
  license: "MIT",
  category: "saas",
  labels: ["nextjs", "saas", "auth", "postgres"],
}

const TEMPLATES = [SAAS_STARTER]

describe("list command", () => {
  let mock: MockServerHandle | null = null

  beforeEach(async () => {
    mock = null
  })

  afterEach(async () => {
    if (mock !== null) {
      await mock.stop()
      mock = null
    }
  })

  it("happy path: prints the template slugs", async () => {
    mock = await startMockServer({ mode: "success", templates: TEMPLATES })
    const result = await run({
      args: ["list"],
      env: { API_BASE_URL: mock.url },
    })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("saas-starter")
    expect(result.stdout).toContain("SaaS Starter")
    expect(result.stdout).toContain("saas")
  })

  it("server error: exits non-zero with network_error code", async () => {
    mock = await startMockServer({ mode: "server_error" })
    const result = await run({
      args: ["list"],
      env: { API_BASE_URL: mock.url },
    })
    expect(result.exitCode).not.toBe(0)
    expect(result.stderr).toContain("network_error")
  })
})
