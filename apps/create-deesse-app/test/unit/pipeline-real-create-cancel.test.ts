import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import * as tar from "tar"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const REPO = "saas-template"
const SHA = "abcdef0123456789abcdef0123456789abcdef01"
const PREFIX_DIR = `${REPO}-${SHA}`

// Mock the network + install so the test is hermetic.
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

vi.mock("../../src/install/run.js", () => ({
  runInstall: vi.fn(),
}))

// Replace `extractTarball` with a stub that simulates the
// abort: it throws an `AbortError`-shaped error after the
// staging tempdir has been created (the abort path must
// clean it up). Mirrors the dry-run cancel test, but the
// pipeline is invoked with `dryRun: false` so the catch
// arm must route the abort to a `mode: "create"` failure
// rather than a `mode: "dry-run"` one.
vi.mock("../../src/extract/extract.js", () => ({
  extractTarball: async (): Promise<void> => {
    const err = new Error("extraction aborted")
    err.name = "AbortError"
    throw err
  },
}))

import { downloadTarball } from "../../src/source/download-tarball.js"
import { run } from "../../src/pipeline.js"

const buildFixtureTarball = (): { tarPath: string; stageDir: string } => {
  const stageDir = mkdtempSync(join(tmpdir(), "cda-real-cancel-"))
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
  workRoot = mkdtempSync(join(tmpdir(), "cda-real-cancel-root-"))
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

describe("run() — real-create cancel handling", () => {
  it("a mid-extract abort cleans the staging tempdir, never creates the destination, and reports mode:'create'", async () => {
    const dir = join(workRoot, "my-app-real-cancel")
    const result = await run({
      projectName: "my-app-real-cancel",
      dir,
      install: true,
      dryRun: false,
      verbose: false,
    })

    // JSON contract
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe("aborted")
    // The mode reflects what the user asked for: a real-create
    // cancel reports `mode: "create"`, never `mode: "dry-run"`.
    expect(result.mode).toBe("create")
    expect(result.projectCreated).toBe(false)

    // BOUNDARY: the destination is not on disk.
    expect(existsSync(dir), "destination must not be created on cancel").toBe(
      false
    )

    // BOUNDARY: the staging tempdir is cleaned. The
    // pipeline creates `<dir>.staging.<uuid>` during
    // validateAndStage and removes it in the catch arm.
    const siblings = readdirSync(workRoot)
    const stagingLeftover = siblings.find((n) =>
      n.toLowerCase().startsWith("my-app-real-cancel.staging.")
    )
    expect(
      stagingLeftover,
      "staging tempdir must be cleaned on cancel"
    ).toBeUndefined()

    // The recovery command is the re-run form: a
    // launcher-agnostic `create-deesse-app@latest
    // <name> [--dir <path>] [--no-install]` shape. The
    // test uses a custom `--dir` (the workRoot + a name),
    // so `--dir` is preserved. The launcher prefix is
    // not in the field — the user adds `pnpm dlx` /
    // `npx` / `npm exec` themselves.
    expect(result.recovery).toBeDefined()
    if (!result.recovery) return
    expect(result.recovery).toMatch(
      /^create-deesse-app@latest my-app-real-cancel --dir /
    )
    // The recovery must NOT contain a `cd` prefix (the
    // destination may not exist yet on this path) and
    // must NOT contain a launcher prefix (the user adds
    // their own).
    expect(result.recovery).not.toMatch(/^cd /)
    expect(result.recovery).not.toContain("pnpm dlx")
    expect(result.recovery).not.toContain("npx ")
  })
})
