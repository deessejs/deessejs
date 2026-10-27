import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import * as tar from "tar"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const REPO = "saas-template"
const SHA = "abcdef0123456789abcdef0123456789abcdef01"
const PREFIX_DIR = `${REPO}-${SHA}`

// Mock the network + probe so the test is hermetic.
vi.mock("../../src/source/resolve-sha.js", () => ({
  resolveTemplateSha: async () => SHA,
}))

vi.mock("../../src/source/download-tarball.js", () => ({
  downloadTarball: vi.fn(),
}))

vi.mock("../../src/pm/probe-paths.js", () => ({
  probeInstallPrereqs: vi.fn(() => ({
    corepack: true,
    npm: true,
    pnpm: false,
  })),
}))

// Replace `extractTarball` with a stub that simulates the
// abort: it throws an `AbortError`-shaped error after
// touching the filesystem (the staging tempdir is created
// before extract, by `validateAndStage`, so the abort
// path must clean it up).
vi.mock("../../src/extract/extract.js", () => ({
  extractTarball: async (): Promise<void> => {
    const err = new Error("extraction aborted")
    err.name = "AbortError"
    throw err
  },
}))

vi.mock("../../src/install/run.js", () => ({
  runInstall: vi.fn(),
}))

import { downloadTarball } from "../../src/source/download-tarball.js"
import { runInstall } from "../../src/install/run.js"
import { run } from "../../src/pipeline.js"

const buildFixtureTarball = (): { tarPath: string; stageDir: string } => {
  const stageDir = mkdtempSync(join(tmpdir(), "cda-dry-cancel-"))
  const inner = join(stageDir, PREFIX_DIR)
  mkdirSync(inner, { recursive: true })
  writeFileSync(join(inner, "LICENSE"), "MIT")
  writeFileSync(
    join(inner, "package.json"),
    '{"name":"x","packageManager":"pnpm@11.0.0"}'
  )
  const tarPath = join(stageDir, "fixture.tgz")
  tar.c({ gzip: true, file: tarPath, cwd: stageDir, sync: true }, [PREFIX_DIR])
  return { tarPath, stageDir }
}

let fixture: { tarPath: string; stageDir: string }
let workRoot: string

beforeEach(() => {
  fixture = buildFixtureTarball()
  workRoot = mkdtempSync(join(tmpdir(), "cda-dry-cancel-root-"))
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

describe("run() — dry-run cancel handling", () => {
  it("a mid-extract abort cleans the staging tempdir and returns a failure", async () => {
    const dir = join(workRoot, "my-app-cancel")
    const result = await run({
      projectName: "my-app-cancel",
      dir,
      install: true,
      dryRun: true,
      verbose: false,
    })

    // The pipeline catches the AbortError and routes it
    // through the catch arm. The error code is "internal"
    // (the closed CreateAppErrorCode set) with a message
    // that names the cancel.
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.message.toLowerCase()).toContain("cancel")
    expect(result.projectCreated).toBe(false)
    // The mode reflects what the user asked for, not what
    // the pipeline produced: a cancelled dry-run reports
    // `mode: "dry-run"`, never `mode: "create"`.
    expect(result.mode).toBe("dry-run")

    // BOUNDARY: the destination is not on disk.
    expect(
      (await import("node:fs")).existsSync(dir),
      "destination must not be created on cancel"
    ).toBe(false)

    // BOUNDARY: the staging tempdir is cleaned. The
    // pipeline creates `<dir>.staging.<uuid>` during
    // validateAndStage and removes it in the catch arm.
    const siblings = (await import("node:fs")).readdirSync(workRoot)
    const stagingLeftover = siblings.find((n) =>
      n.toLowerCase().startsWith("my-app-cancel.staging.")
    )
    expect(
      stagingLeftover,
      "staging tempdir must be cleaned on cancel"
    ).toBeUndefined()

    // BOUNDARY: runInstall is never called.
    expect(vi.mocked(runInstall)).not.toHaveBeenCalled()
  })
})
