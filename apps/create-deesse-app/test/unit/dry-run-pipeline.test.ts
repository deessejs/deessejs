import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import * as tar from "tar"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const REPO = "saas-template"
const SHA = "abcdef0123456789abcdef0123456789abcdef01"
const PREFIX_DIR = `${REPO}-${SHA}`

// Mock the network modules so the dry-run pipeline does not
// touch the real github. The mocked tarball is a real archive
// we build in a stage dir, so the validate + extract passes
// work for real.
vi.mock("../../src/source/resolve-sha.js", () => ({
  resolveTemplateSha: async () => SHA,
}))

vi.mock("../../src/source/download-tarball.js", () => ({
  downloadTarball: vi.fn(),
}))

// Spy on the prereq probe and the install command factory
// so the dry-run tests can assert "no install" boundaries.
vi.mock("../../src/pm/probe-paths.js", () => ({
  probeInstallPrereqs: vi.fn(() => ({
    corepack: true,
    npm: true,
    pnpm: false,
  })),
}))

// Spy on runInstall so the dry-run tests can assert it is
// NEVER called — this is the boundary check the issue calls
// out.
vi.mock("../../src/install/run.js", () => ({
  runInstall: vi.fn(),
}))

import { downloadTarball } from "../../src/source/download-tarball.js"
import { runInstall } from "../../src/install/run.js"
import { probeInstallPrereqs } from "../../src/pm/probe-paths.js"
import { run } from "../../src/pipeline.js"

const buildFixtureTarball = (): { tarPath: string; stageDir: string } => {
  const stageDir = mkdtempSync(join(tmpdir(), "cda-dry-"))
  const inner = join(stageDir, PREFIX_DIR)
  mkdirSync(inner, { recursive: true })
  writeFileSync(join(inner, "LICENSE"), "MIT")
  writeFileSync(
    join(inner, "package.json"),
    '{"name":"next-monorepo","packageManager":"pnpm@11.0.0"}',
  )
  writeFileSync(join(inner, "README.md"), "# DeesseJS\n")
  const tarPath = join(stageDir, "fixture.tgz")
  tar.c({ gzip: true, file: tarPath, cwd: stageDir, sync: true }, [PREFIX_DIR])
  return { tarPath, stageDir }
}

let fixture: { tarPath: string; stageDir: string }
let workRoot: string

beforeEach(() => {
  fixture = buildFixtureTarball()
  workRoot = mkdtempSync(join(tmpdir(), "cda-dry-root-"))
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

describe("run() — dry-run pipeline", () => {
  it("returns mode:\"dry-run\" with the actual resolved SHA, no destination, no install", async () => {
    const dir = join(workRoot, "my-app")
    const result = await run({
      projectName: "my-app",
      dir,
      install: true,
      dryRun: true,
      verbose: false,
    })

    // JSON contract
    expect(result.ok).toBe(true)
    if (!result.ok || result.mode !== "dry-run") return
    expect(result.mode).toBe("dry-run")
    expect(result.projectCreated).toBe(false)
    expect(result.installed).toBe(false)
    expect(result.source.sha).toBe(SHA)
    expect(result.destination).toBe(dir)
    expect(result.packageName.previous).toBe("next-monorepo")
    expect(result.packageName.current).toBe("my-app")
    expect(result.packageManager).toBe("pnpm")
    expect(result.documentation).toBe(
      "https://docs.deessejs.com/getting-started",
    )
    expect(result.recovery).toBeNull()

    // The install section: --install was passed, so the
    // prereq probe and strategy ran. The mocked probe
    // returns { corepack: true, npm: true, pnpm: false }
    // and pickInstallStrategy picks corepack.
    if (result.install.skipped) return
    expect(result.install.skipped).toBe(false)
    expect(result.install.strategy).toBe("corepack")
    expect(result.install.command).toEqual({
      bin: "corepack",
      args: ["pnpm", "install"],
    })
    expect(result.install.prereqs).toEqual({
      corepack: true,
      npm: true,
      pnpm: false,
    })

    // plannedFiles: the three file entries from the fixture.
    // (No directory entries, no empty top-level entry.)
    const paths = result.plannedFiles.map((e) => e.path).sort()
    expect(paths).toEqual(["LICENSE", "README.md", "package.json"])

    // BOUNDARY: the destination is NOT on disk.
    expect(existsSync(dir)).toBe(false)

    // BOUNDARY: the staging tempdir is NOT on disk.
    // The dry-run cleans it up before returning.
    const tempDirSentinel = (dir + ".staging.").toLowerCase()
    // We can't know the exact UUID, but we can check that
    // no `<dir>.staging.<uuid>` directory exists.
    for (const name of readdirSync(workRoot)) {
      expect(name.toLowerCase().startsWith(tempDirSentinel)).toBe(false)
    }

    // BOUNDARY: runInstall was never called.
    expect(vi.mocked(runInstall)).not.toHaveBeenCalled()
  })

  it("--no-install skips the prereq probe and the strategy selection", async () => {
    const dir = join(workRoot, "my-app-noinstall")
    const result = await run({
      projectName: "my-app-noinstall",
      dir,
      install: false,
      dryRun: true,
      verbose: false,
    })

    expect(result.ok).toBe(true)
    if (!result.ok || result.mode !== "dry-run") return

    // install.skipped: true
    expect(result.install.skipped).toBe(true)

    // BOUNDARY: probeInstallPrereqs was NOT called.
    expect(vi.mocked(probeInstallPrereqs)).not.toHaveBeenCalled()

    // BOUNDARY: runInstall was not called.
    expect(vi.mocked(runInstall)).not.toHaveBeenCalled()

    // Destination absent.
    expect(existsSync(dir)).toBe(false)
  })

  it("a malicious archive (unsafe entry) is rejected without creating the destination", async () => {
    const badStage = mkdtempSync(join(tmpdir(), "cda-dry-bad-"))
    const inner = join(badStage, PREFIX_DIR)
    mkdirSync(inner, { recursive: true })
    writeFileSync(join(inner, "LICENSE"), "MIT")
    writeFileSync(
      join(inner, "package.json"),
      '{"name":"x","packageManager":"pnpm@11.0.0"}',
    )
    // Path-traversal entry. tar may not preserve the
    // exact `..` segment depending on the producer, so we
    // hand-craft a tar entry that the validator's regex
    // flags. The simplest reliable trigger is a symlink,
    // which the validator rejects outright.
    const symlinkPath = join(inner, "evil-link")
    try {
      symlinkSync("../escape", symlinkPath)
    } catch {
      // On Windows without admin, symlink creation may
      // fail. Skip the test on those runners; the
      // bad-prefix test in extract.test.ts already covers
      // the archive-rejection path.
      rmSync(badStage, { recursive: true, force: true })
      return
    }
    const tarPath = join(badStage, "fixture.tgz")
    tar.c(
      { gzip: true, file: tarPath, cwd: badStage, sync: true },
      [PREFIX_DIR],
    )
    vi.mocked(downloadTarball).mockResolvedValue({ path: tarPath, sha: SHA })

    const dir = join(workRoot, "my-app-bad")
    const result = await run({
      projectName: "my-app-bad",
      dir,
      install: true,
      dryRun: true,
      verbose: false,
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe("unsafe_archive")
    // The dry-run is non-mutating: the destination is
    // not created even when validation fails.
    expect(existsSync(dir)).toBe(false)
    expect(vi.mocked(runInstall)).not.toHaveBeenCalled()

    rmSync(badStage, { recursive: true, force: true })
  })
})
