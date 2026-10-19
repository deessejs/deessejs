import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import * as tar from "tar"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const REPO = "saas-template"
const SHA = "abcdef0123456789abcdef0123456789abcdef01"
const PREFIX_DIR = `${REPO}-${SHA}`

// Mock the network modules so the pipeline doesn't need
// the network or `git ls-remote`. The mocked tarball is a
// real archive we build in a stage dir, so the validate +
// extract passes work for real.
vi.mock("../../src/source/resolve-sha.js", () => ({
  resolveTemplateSha: async () => SHA,
}))

vi.mock("../../src/source/download-tarball.js", () => ({
  downloadTarball: vi.fn(),
}))

// `pickInstallStrategy` is the only function we override
// here: the prereq probe (`probeInstallPrereqs`) returns
// `corepack: false, npm: false, pnpm: false`, then
// `pickInstallStrategy` throws `unsupported_manager`. This
// is the "no install prereqs on PATH" path: the project is
// already published, the prereq probe fails, and the catch
// arm must report `projectCreated: true` with an install
// recovery.
vi.mock("../../src/pm/probe-paths.js", () => ({
  probeInstallPrereqs: vi.fn(() => ({
    corepack: false,
    npm: false,
    pnpm: false,
  })),
}))

vi.mock("../../src/pm/install-strategy.js", () => ({
  pickInstallStrategy: vi.fn(() => {
    // The real factory throws a CliError with code
    // "unsupported_manager". We import the factory and
    // rethrow it so the test exercises the real error
    // shape — the catch arm checks `err instanceof CliError`
    // and `err.code`, both of which need to be true.
    throw unsupportedManager("pnpm")
  }),
}))

import { downloadTarball } from "../../src/source/download-tarball.js"
import { run } from "../../src/pipeline.js"
import { unsupportedManager } from "../../src/errors/index.js"

const buildFixtureTarball = (): { tarPath: string; stageDir: string } => {
  const stageDir = mkdtempSync(join(tmpdir(), "cda-prereq-"))
  const inner = join(stageDir, PREFIX_DIR)
  mkdirSync(inner, { recursive: true })
  writeFileSync(join(inner, "LICENSE"), "MIT")
  // A valid `packageManager` field so the read in the
  // catch arm can derive a recovery command. The test
  // for the recovery-absent case lives separately.
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
  workRoot = mkdtempSync(join(tmpdir(), "cda-prereq-root-"))
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

describe("run() — prereq failure after publish", () => {
  it("reports the project on disk with an install recovery when no prereq is on PATH", async () => {
    const dir = join(workRoot, "my-app-prereq")
    const result = await run({
      projectName: "my-app-prereq",
      dir,
      install: true,
      dryRun: false,
      verbose: false,
    })

    // JSON contract: the project is on disk, install did
    // not run because the prereq probe failed.
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe("unsupported_manager")
    // The truthful answer: the project IS on disk, even
    // though the install cannot run.
    expect(result.projectCreated).toBe(true)
    // The destination is reported.
    expect(result.destination).toBe(dir)
    // The mode is "create" — the user requested a real
    // create, and the project files are on disk.
    expect(result.mode).toBe("create")

    // The recovery is the no-install form: the user can
    // install pnpm/corepack themselves and then re-run
    // the install via the recovery command. The exact
    // shape depends on the host shell; the structure is
    // stable across platforms.
    expect(result.recovery).toBeDefined()
    if (!result.recovery) return
    if (process.platform === "win32") {
      expect(result.recovery).toMatch(/^cd \/d "/)
      expect(result.recovery).toContain("npm exec --yes -- pnpm@")
      expect(result.recovery).toMatch(/install$/)
    } else {
      expect(result.recovery).toMatch(/^cd '[^']+' && /)
      expect(result.recovery).toContain("npm exec --yes -- pnpm@")
      expect(result.recovery).toMatch(/install$/)
    }

    // BOUNDARY: the project is on disk.
    expect(existsSync(dir)).toBe(true)
    expect(existsSync(join(dir, "LICENSE"))).toBe(true)
    expect(existsSync(join(dir, "package.json"))).toBe(true)
  })
})
