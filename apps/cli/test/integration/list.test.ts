import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, rmSync } from "node:fs"
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

  it("exits 1 with network_error on 500", async () => {
    await api.close()
    api = await startFakeApi({
      handler: () => ({ status: 500, body: "server error" }),
    })
    const result = await runCli(["--api-url", api.url, "list"], { cwd })
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain("network_error")
  })
})
