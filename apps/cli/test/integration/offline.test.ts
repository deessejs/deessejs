import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { startFakeApi, type FakeApi } from "../helpers/fake-api.js"
import { runCli } from "../helpers/run-cli.js"

const FAKE_HOME = join(tmpdir(), `deessejs-cli-offline-${Date.now()}-${Math.random()}`)

// Mock os.homedir before any import of the cache module.
vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>()
  return { ...actual, homedir: () => FAKE_HOME }
})

const CACHE_DIR = join(FAKE_HOME, ".deessejs")

const FIXTURE = {
  slug: "saas-starter",
  name: "SaaS Starter",
  description: "Production-ready Next.js + Better Auth + Postgres.",
  owner: "acme",
  repo: "saas-starter",
  license: "MIT",
  category: "saas",
  labels: ["nextjs", "saas"],
}

describe("--offline mode", () => {
  let api: FakeApi
  let cwd: string

  beforeEach(async () => {
    if (existsSync(FAKE_HOME)) rmSync(FAKE_HOME, { recursive: true })
    mkdirSync(FAKE_HOME, { recursive: true })
    api = await startFakeApi({ templates: [FIXTURE] })
    cwd = join(FAKE_HOME, "work")
    mkdirSync(cwd, { recursive: true })
  })

  afterEach(async () => {
    if (api) await api.close()
    if (existsSync(FAKE_HOME)) rmSync(FAKE_HOME, { recursive: true })
  })

  it("--offline without cache exits 1 with a clear message", async () => {
    const result = await runCli(
      ["--api-url", api.url, "--offline", "list"],
      { cwd, env: { HOME: FAKE_HOME, USERPROFILE: FAKE_HOME } },
    )
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain("no cached registry")
  })

  it("--offline with cache serves cached data without hitting the network", async () => {
    // First, populate the cache by running online.
    const first = await runCli(["--api-url", api.url, "list"], {
      cwd,
      env: { HOME: FAKE_HOME, USERPROFILE: FAKE_HOME },
    })
    expect(first.exitCode).toBe(0)
    expect(existsSync(join(CACHE_DIR, "templates.json"))).toBe(true)

    // Now take the API offline. The CLI should serve cache, not fail.
    await api.close()
    api = await startFakeApi({ handler: () => ({ status: 500, body: "down" }) })

    const second = await runCli(
      ["--api-url", api.url, "--offline", "list"],
      { cwd, env: { HOME: FAKE_HOME, USERPROFILE: FAKE_HOME } },
    )
    expect(second.exitCode).toBe(0)
    expect(second.stdout).toContain("saas-starter")
  })

  it("fallback to cache when network fails on online call (cache present)", async () => {
    // Populate cache first.
    await runCli(["--api-url", api.url, "list"], {
      cwd,
      env: { HOME: FAKE_HOME, USERPROFILE: FAKE_HOME },
    })

    // Take API down.
    await api.close()
    api = await startFakeApi({ handler: () => ({ status: 503, body: "down" }) })

    // Run online (no --offline flag) — should warn and use cache.
    const result = await runCli(["--api-url", api.url, "list"], {
      cwd,
      env: { HOME: FAKE_HOME, USERPROFILE: FAKE_HOME },
    })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("saas-starter")
    expect(result.stderr).toMatch(/cached registry/i)
  })
})
