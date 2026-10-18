import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import * as tar from "tar"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const REPO = "saas-template"
const SHA = "abcdef0123456789abcdef0123456789abcdef01"
const PREFIX_DIR = `${REPO}-${SHA}`

// Mock the source modules so the pipeline doesn't need the network or
// `git ls-remote`. The mocked tarball is a real archive we build in a
// stage dir, so the validate + extract passes work for real.
vi.mock("../../src/source/resolve-sha.js", () => ({
  resolveTemplateSha: async () => SHA,
}))

vi.mock("../../src/source/download-tarball.js", () => ({
  // The factory function returns a tuple [tarballPath, stageDir] so the
  // afterEach can clean it up.
  downloadTarball: vi.fn(),
}))

// Mock the install runner to inject a controlled failure. The shape
// matches the real RunInstallResult failure variant.
vi.mock("../../src/install/run.js", () => ({
  runInstall: vi.fn(),
}))

import { downloadTarball } from "../../src/source/download-tarball.js"
import { runInstall } from "../../src/install/run.js"
import { run } from "../../src/pipeline.js"

const buildFixtureTarball = (): { tarPath: string; stageDir: string } => {
  const stageDir = mkdtempSync(join(tmpdir(), "cda-pipe-"))
  const inner = join(stageDir, PREFIX_DIR)
  mkdirSync(inner, { recursive: true })
  writeFileSync(join(inner, "LICENSE"), "MIT")
  // The generated project's `packageManager` field is read
  // by the pipeline in this increment (#226). Without it,
  // the pipeline throws `source_failed` before install runs,
  // which would mask the install-failure contract we are
  // testing here.
  writeFileSync(
    join(inner, "package.json"),
    '{"name":"next-monorepo","packageManager":"pnpm@11.0.0"}',
  )
  const tarPath = join(stageDir, "fixture.tgz")
  tar.c({ gzip: true, file: tarPath, cwd: stageDir, sync: true }, [PREFIX_DIR])
  return { tarPath, stageDir }
}

let fixture: { tarPath: string; stageDir: string }
let workRoot: string

beforeEach(() => {
  fixture = buildFixtureTarball()
  workRoot = mkdtempSync(join(tmpdir(), "cda-pipe-root-"))
  vi.mocked(downloadTarball).mockResolvedValue({
    path: fixture.tarPath,
    sha: SHA,
  })
})

afterEach(() => {
  rmSync(fixture.stageDir, { recursive: true, force: true })
  rmSync(workRoot, { recursive: true, force: true })
  vi.clearAllMocks()
})

describe("run() — install failure contract", () => {
  it("returns ok:false with installed:false, the recovery command, and the captured install output", async () => {
    vi.mocked(runInstall).mockResolvedValue({
      ok: false,
      code: 1,
      stderr: "ERR_PNPM_PEER_DEP_ISSUES  Unmet peer dependencies\n",
      stdout: "Lockfile is up to date, resolution step is skipped\n",
    })

    const dir = join(workRoot, "my-app")
    const result = await run({ projectName: "my-app", dir, install: true })

    // JSON contract: ok:false, projectCreated:true (the files are on disk),
    // installed:false (the contract the reviewer called out).
    expect(result.ok).toBe(false)
    if (result.ok) return // narrow for type-checker
    expect(result.projectCreated).toBe(true)
    expect(result.installed).toBe(false)
    expect(result.error.code).toBe("install_failed")
    // The recovery command is the live-install form, with the
    // chosen strategy and the version quoted. We assert the
    // shape, not the literal string, because the strategy
    // depends on what the probe saw in PATH at runtime.
    expect(result.recovery).toMatch(
      // The literal "cd /d" on Windows is two words; "cd" on
      // POSIX is one word. The optional " /d" (with a leading
      // space) covers both. The path is single-quoted and
      // contains no single quotes (the helper escapes them).
      /^cd(?: \/d)? '[^']+' && (?:corepack pnpm install|npm exec --yes -- pnpm@11\.0\.0 install|pnpm install)$/,
    )
    if (result.error.code === "install_failed") {
      expect(result.installOutput.code).toBe(1)
      expect(result.installOutput.stderr).toContain("ERR_PNPM_PEER_DEP_ISSUES")
      expect(result.installOutput.stdout).toContain("Lockfile is up to date")
    }

    // The project is on disk.
    expect(existsSync(dir)).toBe(true)
    expect(existsSync(join(dir, "LICENSE"))).toBe(true)
    expect(existsSync(join(dir, "package.json"))).toBe(true)
  })

  it("the JSON path is one valid object parseable by scripts", async () => {
    vi.mocked(runInstall).mockResolvedValue({
      ok: false,
      code: 2,
      stderr: "boom",
      stdout: "",
    })

    const dir = join(workRoot, "my-app-2")
    const result = await run({ projectName: "my-app-2", dir, install: true })

    // Round-trip through JSON.stringify to confirm the structure is
    // serializable (no cycles, no functions, no BigInt, etc.).
    const round = JSON.parse(JSON.stringify(result))
    expect(round.ok).toBe(false)
    expect(round.installed).toBe(false)
    expect(round.projectCreated).toBe(true)
  })

  it("does NOT delete the project when install fails", async () => {
    vi.mocked(runInstall).mockResolvedValue({
      ok: false,
      code: 1,
      stderr: "boom",
      stdout: "",
    })

    const dir = join(workRoot, "my-app-3")
    const result = await run({ projectName: "my-app-3", dir, install: true })

    expect(result.ok).toBe(false)
    // Filesystem sanity: the project is still there.
    expect(existsSync(dir)).toBe(true)
    expect(existsSync(join(dir, "LICENSE"))).toBe(true)
    expect(existsSync(join(dir, "package.json"))).toBe(true)
  })
})
