import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import * as tar from "tar"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const REPO = "saas-template"
const SHA = "abcdef0123456789abcdef0123456789abcdef01"
const PREFIX_DIR = `${REPO}-${SHA}`

vi.mock("../../src/source/resolve-sha.js", () => ({
  resolveTemplateSha: async () => SHA,
}))

vi.mock("../../src/source/download-tarball.js", () => ({
  downloadTarball: vi.fn(),
}))

// Spy on the probe. The test asserts it is NEVER called
// when --dry-run is combined with --no-install.
vi.mock("../../src/pm/probe-paths.js", () => ({
  probeInstallPrereqs: vi.fn(() => {
    throw new Error("probeInstallPrereqs must not be called under --no-install")
  }),
}))

vi.mock("../../src/pm/install-strategy.js", () => ({
  pickInstallStrategy: vi.fn(() => {
    throw new Error("pickInstallStrategy must not be called under --no-install")
  }),
}))

vi.mock("../../src/install/run.js", () => ({
  runInstall: vi.fn(),
}))

import { downloadTarball } from "../../src/source/download-tarball.js"
import { probeInstallPrereqs } from "../../src/pm/probe-paths.js"
import { run } from "../../src/pipeline.js"

const buildFixtureTarball = (): { tarPath: string; stageDir: string } => {
  const stageDir = mkdtempSync(join(tmpdir(), "cda-dry-ni-"))
  const inner = join(stageDir, PREFIX_DIR)
  mkdirSync(inner, { recursive: true })
  writeFileSync(join(inner, "LICENSE"), "MIT")
  writeFileSync(
    join(inner, "package.json"),
    '{"name":"x","packageManager":"pnpm@11.0.0"}',
  )
  const tarPath = join(stageDir, "fixture.tgz")
  tar.c({ gzip: true, file: tarPath, cwd: stageDir, sync: true }, [PREFIX_DIR])
  return { tarPath, stageDir }
}

let fixture: { tarPath: string; stageDir: string }
let workRoot: string

beforeEach(() => {
  fixture = buildFixtureTarball()
  workRoot = mkdtempSync(join(tmpdir(), "cda-dry-ni-root-"))
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

describe("run() — --dry-run --no-install", () => {
  it("does NOT call probeInstallPrereqs and emits install.skipped:true", async () => {
    const dir = join(workRoot, "my-app-ni")
    const result = await run({
      projectName: "my-app-ni",
      dir,
      install: false,
      dryRun: true,
      verbose: false,
    })

    expect(result.ok).toBe(true)
    if (!result.ok || result.mode !== "dry-run") return
    expect(result.install.skipped).toBe(true)

    // BOUNDARY: the probe is never called. The mock
    // throws if it is, so the assertion below is a
    // belt-and-braces check.
    expect(vi.mocked(probeInstallPrereqs)).not.toHaveBeenCalled()

    // BOUNDARY: the destination is not on disk.
    expect(
      (await import("node:fs")).existsSync(dir),
      "destination must not be created",
    ).toBe(false)

    // The plan still includes the source SHA and the
    // planned file list — those are the parts the
    // --no-install combination does not change.
    expect(result.source.sha).toBe(SHA)
    expect(result.plannedFiles.map((e) => e.path).sort()).toEqual([
      "LICENSE",
      "package.json",
    ])
  })
})
