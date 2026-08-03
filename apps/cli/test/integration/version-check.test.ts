import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { existsSync, mkdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { startFakeApi, type FakeApi } from "../helpers/fake-api.js"
import { runCli } from "../helpers/run-cli.js"

const FAKE_HOME = join(tmpdir(), `deessejs-cli-version-${Date.now()}-${Math.random()}`)

vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>()
  return { ...actual, homedir: () => FAKE_HOME }
})

describe("version check", () => {
  let api: FakeApi
  let cwd: string

  beforeEach(async () => {
    if (existsSync(FAKE_HOME)) rmSync(FAKE_HOME, { recursive: true })
    mkdirSync(FAKE_HOME, { recursive: true })
    cwd = join(FAKE_HOME, "work")
    mkdirSync(cwd, { recursive: true })
  })

  afterEach(async () => {
    if (api) await api.close()
    if (existsSync(FAKE_HOME)) rmSync(FAKE_HOME, { recursive: true })
  })

  it("warns when local version is below minSupported", async () => {
    api = await startFakeApi({
      handler: (req) => {
        if (req.url?.endsWith("/cli-version")) {
          return { status: 200, body: JSON.stringify({ version: "2.0.0", minSupported: "2.0.0" }) }
        }
        return { status: 200, body: JSON.stringify({ templates: [FIXTURE] }) }
      },
    })

    const result = await runCli(["--api-url", api.url, "list"], {
      cwd,
      env: { HOME: FAKE_HOME, USERPROFILE: FAKE_HOME },
    })
    expect(result.exitCode).toBe(0) // command still succeeds
    expect(result.stderr).toContain("below the minimum supported")
    expect(result.stderr).toContain("deessejs@latest")
  })

  it("does not warn when local version equals minSupported", async () => {
    api = await startFakeApi({
      handler: (req) => {
        if (req.url?.endsWith("/cli-version")) {
          return { status: 200, body: JSON.stringify({ version: "1.0.1", minSupported: "1.0.0" }) }
        }
        return { status: 200, body: JSON.stringify({ templates: [FIXTURE] }) }
      },
    })

    const result = await runCli(["--api-url", api.url, "list"], {
      cwd,
      env: { HOME: FAKE_HOME, USERPROFILE: FAKE_HOME },
    })
    expect(result.exitCode).toBe(0)
    expect(result.stderr).not.toContain("below the minimum")
  })

  it("swallows version-check errors silently (best-effort)", async () => {
    api = await startFakeApi({
      handler: () => ({ status: 500, body: "down" }),
    })

    const result = await runCli(["--api-url", api.url, "list"], {
      cwd,
      env: { HOME: FAKE_HOME, USERPROFILE: FAKE_HOME },
    })
    // The list command may still fail because the templates endpoint
    // is also down, but it should never crash with a version-related
    // error message.
    expect(result.stderr).not.toContain("below the minimum")
  })
})

const FIXTURE = {
  slug: "saas-starter",
  name: "SaaS Starter",
  description: "Production-ready.",
  owner: "acme",
  repo: "saas-starter",
  license: "MIT",
  category: "saas",
  labels: [],
}
