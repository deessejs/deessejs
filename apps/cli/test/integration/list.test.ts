import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdirSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { startFakeApi, type FakeApi } from "../helpers/fake-api.js"
import { runCli } from "../helpers/run-cli.js"

const FIXTURE = {
  slug: "saas-starter",
  name: "SaaS Starter",
  description: "Production-ready Next.js + Auth + DB.",
  owner: "acme",
  repo: "saas-starter",
  license: "MIT",
  category: "saas",
  labels: ["nextjs", "saas"],
}

describe("deessejs list", () => {
  let api: FakeApi
  let cwd: string

  beforeEach(async () => {
    api = await startFakeApi({ templates: [FIXTURE] })
    cwd = mkdtempSync(join(tmpdir(), "list-test-"))
  })

  afterEach(async () => {
    if (api) await api.close()
    if (cwd) rmSync(cwd, { recursive: true, force: true })
  })

  it("renders templates table on success", async () => {
    const result = await runCli(["--api-url", api.url, "list"], { cwd })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("saas-starter")
    expect(result.stdout).toContain("SaaS Starter")
  })

  it("prints 'No templates available' when API returns empty array", async () => {
    await api.close()
    api = await startFakeApi({ templates: [] })
    const result = await runCli(["--api-url", api.url, "list"], { cwd })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("No templates available")
  })

  it("degrades gracefully to cache on 500 (cache present)", async () => {
    // Populate cache first.
    await runCli(["--api-url", api.url, "list"], { cwd })
    // Take API down.
    await api.close()
    api = await startFakeApi({
      handler: () => ({ status: 500, body: "server error" }),
    })
    const result = await runCli(["--api-url", api.url, "list"], { cwd })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("saas-starter")
    expect(result.stderr).toMatch(/cached registry/i)
  })

  it("exits 1 with network_error on 500 when no cache exists", async () => {
    // Use an empty HOME so no pre-existing cache from other tests
    // contaminates the assertion. vitest's tmpdir is per-run.
    const emptyHome = join(tmpdir(), `deessejs-list-empty-${Date.now()}`)
    mkdirSync(emptyHome, { recursive: true })
    await api.close()
    api = await startFakeApi({
      handler: () => ({ status: 500, body: "server error" }),
    })
    const result = await runCli(["--api-url", api.url, "list"], {
      cwd,
      env: { HOME: emptyHome, USERPROFILE: emptyHome },
    })
    rmSync(emptyHome, { recursive: true, force: true })
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain("network_error")
  })
})
