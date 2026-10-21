import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
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

// `runInstall` is the seam we test: the mock simulates
// the new `aborted: true` variant of `RunInstallResult`,
// which the pipeline routes to `error.code: "aborted"`
// with `projectCreated: true` and the install recovery.
vi.mock("../../src/install/run.js", () => ({
  runInstall: vi.fn(),
}))

import { downloadTarball } from "../../src/source/download-tarball.js"
import { runInstall } from "../../src/install/run.js"
import { run } from "../../src/pipeline.js"

const buildFixtureTarball = (): { tarPath: string; stageDir: string } => {
  const stageDir = mkdtempSync(join(tmpdir(), "cda-install-cancel-"))
  const inner = join(stageDir, PREFIX_DIR)
  mkdirSync(inner, { recursive: true })
  writeFileSync(join(inner, "LICENSE"), "MIT")
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
  workRoot = mkdtempSync(join(tmpdir(), "cda-install-cancel-root-"))
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

describe("run() — install-time cancel", () => {
  it("aborted mid-install reports projectCreated:true with the install recovery and the project on disk", async () => {
    // The mocked `runInstall` returns the `aborted: true`
    // variant — the shape the new `runInstall` emits when
    // the AbortSignal fires mid-flight.
    vi.mocked(runInstall).mockResolvedValue({
      ok: false,
      aborted: true,
      code: null,
      stderr: "starting pnpm install...\n",
      stdout: "",
    })

    const dir = join(workRoot, "my-app-install-cancel")
    const result = await run({
      projectName: "my-app-install-cancel",
      dir,
      install: true,
      dryRun: false,
      verbose: false,
    })

    // JSON contract
    expect(result.ok).toBe(false)
    if (result.ok) return
    // The error code is "aborted", NOT "install_failed" —
    // the cancel was signal-driven, not an install
    // failure.
    expect(result.error.code).toBe("aborted")
    // The project IS on disk; the cancel happened
    // mid-install, not before publish.
    expect(result.projectCreated).toBe(true)
    // Mode reflects the requested operation.
    expect(result.mode).toBe("create")
    // The destination is reported.
    expect(result.destination).toBe(dir)

    // The recovery is the INSTALL recovery, not the
    // re-run form. The user can re-run the install
    // (after killing the child if it's still alive)
    // without re-doing the create. The shape depends
    // on the host shell.
    expect(result.recovery).toBeDefined()
    if (!result.recovery) return
    if (process.platform === "win32") {
      expect(result.recovery).toMatch(/^cd \/d "/)
    } else {
      expect(result.recovery).toMatch(/^cd '[^']+' && /)
    }
    // The install command is the strategy the pipeline
    // chose (corepack, in the mocked prereq probe). On
    // POSIX hosts the args are space-joined; on Windows
    // each arg is independently double-quoted, so the
    // literal substring "pnpm install" is platform-
    // specific. The structure test (recoveryCommand
    // shape) is the authoritative check; here we just
    // confirm the strategy is named.
    expect(result.recovery).toContain("corepack")
    // The install is a `pnpm install` invocation, which
    // on POSIX appears as the substring and on Windows
    // as `"pnpm" "install"`. Both contain `pnpm` and the
    // `install` keyword.
    expect(result.recovery).toMatch(/\bpnpm\b/)
    expect(result.recovery).toContain("install")

    // The recovery is NOT the create-deesse-app re-run
    // form: there is no project re-creation, just an
    // install retry.
    expect(result.recovery).not.toContain("create-deesse-app@latest")
    expect(result.recovery).not.toMatch(/^cd .* && pnpm dlx/)

    // BOUNDARY: the project is on disk.
    expect(existsSync(dir)).toBe(true)
    expect(existsSync(join(dir, "LICENSE"))).toBe(true)
    expect(existsSync(join(dir, "package.json"))).toBe(true)
  })

  it("aborted mid-install with a non-null child exit code (child exited before kill) still routes to aborted", async () => {
    // The race scenario: the signal fires, the abort
    // listener sets the flag, then the child happens to
    // exit on its own (e.g. the install completed
    // between the signal and the kill). The pipeline
    // must still route to `aborted` because the user
    // signaled cancel — the install should not be
    // reported as a success.
    vi.mocked(runInstall).mockResolvedValue({
      ok: false,
      aborted: true,
      code: 143, // SIGTERM exit code on POSIX
      stderr: "starting pnpm install...\n",
      stdout: "",
    })

    const dir = join(workRoot, "my-app-install-cancel-143")
    const result = await run({
      projectName: "my-app-install-cancel-143",
      dir,
      install: true,
      dryRun: false,
      verbose: false,
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe("aborted")
    expect(result.projectCreated).toBe(true)
    expect(result.recovery).toContain("corepack")
    expect(result.recovery).toMatch(/\bpnpm\b/)
    expect(result.recovery).toContain("install")
  })
})
