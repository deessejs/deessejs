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

describe("deessejs info", () => {
  let api: FakeApi
  let cwd: string

  beforeEach(async () => {
    api = await startFakeApi({ templates: [FIXTURE] })
    cwd = mkdtempSync(join(tmpdir(), "info-test-"))
  })

  afterEach(async () => {
    if (api) await api.close()
    if (cwd) rmSync(cwd, { recursive: true, force: true })
  })

  it("prints full template info to stdout", async () => {
    const result = await runCli(
      ["--api-url", api.url, "info", FIXTURE.slug],
      { cwd },
    )
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain(FIXTURE.slug)
    expect(result.stdout).toContain(FIXTURE.name)
    expect(result.stdout).toContain(`${FIXTURE.owner}/${FIXTURE.repo}`)
  })

  it("exits 1 with not_found for unknown slug; hints at available slugs", async () => {
    const result = await runCli(
      ["--api-url", api.url, "info", "unknown-slug"],
      { cwd },
    )
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain("not_found")
    expect(result.stderr).toContain(FIXTURE.slug)
  })

  it("emits JSON with --json", async () => {
    const result = await runCli(
      ["--api-url", api.url, "info", FIXTURE.slug, "--json"],
      { cwd },
    )
    expect(result.exitCode).toBe(0)
    const parsed = JSON.parse(result.stdout) as {
      template: { slug: string }
    }
    expect(parsed.template.slug).toBe(FIXTURE.slug)
  })
})
