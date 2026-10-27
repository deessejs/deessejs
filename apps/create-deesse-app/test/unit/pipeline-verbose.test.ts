import {
  existsSync,
  mkdirSync,
  mkdtempSync,
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

// Mock the network + install so the test is hermetic. The
// tarball is real (built into a stage dir), so validate and
// extract run for real.
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

// Recording state shared across tests. The logger module
// is mocked to expose two factory functions: `nullLogger`
// stays a true no-op (mirroring the real `nullLogger`)
// and `stderrLogger` returns a Logger whose three methods
// are spies that record every call into a shared `lineLog`.
// The tests assert on the recorded events.
const lineLog: { factory: "null" | "stderr"; level: string; event: string }[] =
  []
const resetLog = (): void => {
  lineLog.length = 0
}

const stderrFactoryCalls = vi.fn()

vi.mock("../../src/output/logger.js", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/output/logger.js")
  >("../../src/output/logger.js")
  return {
    ...actual,
    // Keep `nullLogger` as a true no-op so the verbose:false
    // test path stays silent. We only spy on the stderr
    // factory's output.
    nullLogger: actual.nullLogger,
    stderrLogger: () => {
      stderrFactoryCalls()
      const record =
        (level: "info" | "warn" | "error") =>
        (event: string): void => {
          lineLog.push({ factory: "stderr", level, event })
        }
      return {
        info: record("info"),
        warn: record("warn"),
        error: record("error"),
      }
    },
  }
})

import { downloadTarball } from "../../src/source/download-tarball.js"
import { runInstall } from "../../src/install/run.js"
import { run } from "../../src/pipeline.js"

const buildFixtureTarball = (): { tarPath: string; stageDir: string } => {
  const stageDir = mkdtempSync(join(tmpdir(), "cda-verbose-"))
  const inner = join(stageDir, PREFIX_DIR)
  mkdirSync(inner, { recursive: true })
  writeFileSync(join(inner, "LICENSE"), "MIT")
  writeFileSync(
    join(inner, "package.json"),
    '{"name":"next-monorepo","packageManager":"pnpm@11.0.0"}'
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
  workRoot = mkdtempSync(join(tmpdir(), "cda-verbose-root-"))
  resetLog()
  stderrFactoryCalls.mockClear()
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

const eventsFromFactory = (factory: "null" | "stderr"): string[] =>
  lineLog.filter((l) => l.factory === factory).map((l) => l.event)

describe("run() — --verbose narration", () => {
  it("verbose:false picks nullLogger — narration is silent", async () => {
    const dir = join(workRoot, "my-app")
    const result = await run({
      projectName: "my-app",
      dir,
      // install:false keeps the test off the runInstall
      // path so the mocked `runInstall` returning
      // undefined is not exercised.
      install: false,
      dryRun: false,
      verbose: false,
    })

    expect(result.ok).toBe(true)
    // The pipeline routed through the null factory; no
    // stderr factory was constructed and no events were
    // emitted to either logger.
    expect(stderrFactoryCalls).not.toHaveBeenCalled()
    expect(eventsFromFactory("stderr")).toEqual([])
  })

  it("verbose:true on a real create emits the expected narration sequence", async () => {
    vi.mocked(runInstall).mockResolvedValue({ ok: true })

    const dir = join(workRoot, "my-app-verbose")
    const result = await run({
      projectName: "my-app-verbose",
      dir,
      install: true,
      dryRun: false,
      verbose: true,
    })
    expect(result.ok).toBe(true)

    // The pipeline routed through the stderr factory.
    expect(stderrFactoryCalls).toHaveBeenCalledTimes(1)

    const events = eventsFromFactory("stderr")
    expect(events).toContain("starting create")
    expect(events).toContain("resolving source SHA")
    expect(events).toContain("resolved source SHA")
    expect(events).toContain("downloaded archive")
    expect(events).toContain("validating archive entries")
    expect(events).toContain("validated entries")
    expect(events).toContain("staged template")
    expect(events).toContain("published project")
    expect(events).toContain("probing install prereqs")
    expect(events).toContain("install strategy chosen")
    expect(events).toContain("running install")
    expect(events).toContain("install completed")

    // Order check: SHA resolved before archive downloaded,
    // install ran after project was published.
    const findEvent = (needle: string): number =>
      events.findIndex((e) => e === needle)
    expect(findEvent("resolved source SHA")).toBeLessThan(
      findEvent("downloaded archive")
    )
    expect(findEvent("published project")).toBeLessThan(
      findEvent("running install")
    )
    expect(findEvent("running install")).toBeLessThan(
      findEvent("install completed")
    )
    expect(findEvent("starting create")).toBe(0)
  })

  it("verbose:true on a dry-run emits 'dry-run plan ready' instead of running install", async () => {
    const dir = join(workRoot, "my-app-dry-verbose")
    const result = await run({
      projectName: "my-app-dry-verbose",
      dir,
      install: true,
      dryRun: true,
      verbose: true,
    })

    expect(result.ok).toBe(true)
    if (!result.ok || result.mode !== "dry-run") return

    const events = eventsFromFactory("stderr")
    expect(events).toContain("starting dry-run")
    expect(events).toContain("resolving source SHA")
    expect(events).toContain("staged template")
    expect(events).toContain("probing install prereqs")
    expect(events).toContain("install strategy chosen")
    expect(events).toContain("dry-run plan ready")
    // The dry-run never runs install.
    expect(events).not.toContain("running install")
    expect(events).not.toContain("install completed")
    // The dry-run never publishes.
    expect(events).not.toContain("published project")

    // runInstall was never called.
    expect(vi.mocked(runInstall)).not.toHaveBeenCalled()
    // Destination is absent.
    expect(existsSync(dir)).toBe(false)
  })

  it("verbose:true on a real create with --no-install emits 'install skipped'", async () => {
    const dir = join(workRoot, "my-app-skip-verbose")
    const result = await run({
      projectName: "my-app-skip-verbose",
      dir,
      install: false,
      dryRun: false,
      verbose: true,
    })

    expect(result.ok).toBe(true)
    if (!result.ok || result.mode !== "create") return

    const events = eventsFromFactory("stderr")
    expect(events).toContain("starting create")
    expect(events).toContain("published project")
    expect(events).toContain("install skipped")
    // The no-install path never probes or runs install.
    expect(events).not.toContain("probing install prereqs")
    expect(events).not.toContain("running install")
  })

  it("verbose:true on install failure emits 'install failed' with the exit code", async () => {
    vi.mocked(runInstall).mockResolvedValue({
      ok: false,
      aborted: false,
      code: 1,
      stderr: "boom",
      stdout: "",
    })

    const dir = join(workRoot, "my-app-fail-verbose")
    const result = await run({
      projectName: "my-app-fail-verbose",
      dir,
      install: true,
      dryRun: false,
      verbose: true,
    })

    expect(result.ok).toBe(false)

    const events = eventsFromFactory("stderr")
    expect(events).toContain("running install")
    expect(events).toContain("install failed")
  })
})
