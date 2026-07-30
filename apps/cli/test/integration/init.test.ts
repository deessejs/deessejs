import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { startFakeApi, type FakeApi } from "../helpers/fake-api.js"
import { createGitFixture, type GitFixture } from "../helpers/git-fixture.js"
import { runCli } from "../helpers/run-cli.js"

const gitAvailable = ((): boolean => {
  try {
    const probe = mkdtempSync(join(tmpdir(), "deessejs-gitprobe-"))
    try {
      execFileSync("git", ["init", "--bare"], { cwd: probe, stdio: "ignore" })
      return true
    } finally {
      rmSync(probe, { recursive: true, force: true })
    }
  } catch {
    return false
  }
})()

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

describe.skipIf(process.platform === "win32" || !gitAvailable)("deessejs init", () => {
  let api: FakeApi
  let git: GitFixture
  let cwd: string

  beforeEach(async () => {
    git = await createGitFixture({
      name: "saas-starter",
      defaultBranch: "master",
      files: {
        "package.json": JSON.stringify({
          name: "saas-starter",
          version: "0.0.0",
          packageManager: "pnpm@9.0.0",
        }),
      },
    })
    api = await startFakeApi({
      templates: [{ ...FIXTURE, cloneUrl: git.remoteUrl }],
    })
    cwd = mkdtempSync(join(tmpdir(), "init-test-"))
  })

  afterEach(async () => {
    if (api) await api.close()
    if (git) git.cleanup()
    if (cwd) rmSync(cwd, { recursive: true, force: true })
  })

  it("happy path: clones repo (--no-install) and exits 0", async () => {
    const result = await runCli(
      [
        "--api-url",
        api.url,
        "init",
        FIXTURE.slug,
        "--no-install",
        "--dir",
        cwd,
      ],
      { cwd },
    )
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("Cloned into")
    expect(result.stdout).toContain("Template ready")
    expect(existsSync(join(cwd, "package.json"))).toBe(true)
  })

  it("refuses when target dir exists", async () => {
    const targetDir = join(cwd, FIXTURE.slug)
    mkdirSync(targetDir, { recursive: true })
    const result = await runCli(
      [
        "--api-url",
        api.url,
        "init",
        FIXTURE.slug,
        "--no-install",
        "--dir",
        targetDir,
      ],
      { cwd },
    )
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain("target_exists")
  })

  it("--force overwrites an existing target dir", async () => {
    const targetDir = join(cwd, FIXTURE.slug)
    mkdirSync(targetDir, { recursive: true })
    const result = await runCli(
      [
        "--api-url",
        api.url,
        "init",
        FIXTURE.slug,
        "--no-install",
        "--force",
        "--dir",
        cwd,
      ],
      { cwd },
    )
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("Template ready")
  })

  it("falls back to master when main doesn't exist", async () => {
    const result = await runCli(
      [
        "--api-url",
        api.url,
        "init",
        FIXTURE.slug,
        "--no-install",
        "--dir",
        cwd,
      ],
      { cwd },
    )
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("master")
  })

  it("reads packageManager field from cloned repo", async () => {
    const result = await runCli(
      [
        "--api-url",
        api.url,
        "init",
        FIXTURE.slug,
        "--no-install",
        "--dir",
        cwd,
      ],
      { cwd },
    )
    expect(result.exitCode).toBe(0)
    const pkg = JSON.parse(readFileSync(join(cwd, "package.json"), "utf8")) as {
      packageManager: string
    }
    expect(pkg.packageManager).toBe("pnpm@9.0.0")
  })

  it("exits 1 with not_found for unknown slug", async () => {
    const result = await runCli(
      [
        "--api-url",
        api.url,
        "init",
        "does-not-exist",
        "--no-install",
        "--dir",
        cwd,
      ],
      { cwd },
    )
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain("not_found")
  })
})
