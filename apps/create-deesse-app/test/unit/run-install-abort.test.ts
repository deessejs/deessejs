import { afterEach, describe, expect, it, vi } from "vitest"

import { runInstall } from "../../src/install/run.js"
import { pnpm } from "../../src/pm/pnpm.js"

// Low-level test for `runInstall`'s AbortSignal handling.
// The mock in pipeline-install-cancel.test.ts covers the
// pipeline-level routing; this file exercises `runInstall`
// directly with a real child process (a `node -e` loop that
// ignores SIGTERM up to 4s, then exits) so the
// SIGTERM-then-SIGKILL path is real, not a mock.

const LONG_RUNNING_SCRIPT = `
  let ticks = 0
  const id = setInterval(() => {
    ticks++
    if (ticks >= 20) clearInterval(id)
  }, 200)
  process.on('SIGTERM', () => { /* ignore, force SIGKILL */ })
`

afterEach(() => {
  vi.restoreAllMocks()
})

describe("runInstall — AbortSignal handling", () => {
  it("resolves with aborted:true when the signal fires after spawn", async () => {
    const controller = new AbortController()
    const command = {
      bin: process.execPath, // node
      args: ["-e", LONG_RUNNING_SCRIPT],
    }
    const resultPromise = runInstall({
      command,
      managerId: "pnpm",
      cwd: process.cwd(),
      signal: controller.signal,
    })
    // Give the child a moment to start, then abort.
    setTimeout(() => controller.abort(), 100)
    const result = await resultPromise
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.aborted).toBe(true)
    // The child is either still running (SIGKILL pending)
    // or has exited. The `code` is either `null` (killed
    // by signal) or a numeric exit code (143 on POSIX for
    // SIGTERM). We accept both.
    expect(result.code === null || typeof result.code === "number").toBe(true)
  }, 10_000)

  it("resolves with aborted:true when the signal is already aborted at call time", async () => {
    const controller = new AbortController()
    controller.abort() // pre-aborted
    const command = {
      bin: process.execPath,
      args: ["-e", LONG_RUNNING_SCRIPT],
    }
    const result = await runInstall({
      command,
      managerId: "pnpm",
      cwd: process.cwd(),
      signal: controller.signal,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.aborted).toBe(true)
  }, 10_000)

  it("does NOT route to aborted when the child exits on its own (the signal never fires)", async () => {
    const controller = new AbortController()
    // A child that exits on its own with code 0.
    const command = {
      bin: process.execPath,
      args: ["-e", "process.exit(0)"],
    }
    const result = await runInstall({
      command,
      managerId: "pnpm",
      cwd: process.cwd(),
      signal: controller.signal,
    })
    expect(result.ok).toBe(true)
  })

  it("does NOT route to aborted when the child exits non-zero without a signal", async () => {
    const controller = new AbortController()
    // A child that exits with code 2, no signal involved.
    const command = {
      bin: process.execPath,
      args: ["-e", "process.exit(2)"],
    }
    const result = await runInstall({
      command,
      managerId: "pnpm",
      cwd: process.cwd(),
      signal: controller.signal,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.aborted).toBe(false)
    if (!result.aborted) {
      expect(result.code).toBe(2)
    }
  })

  it("works without a signal (backward-compatible call site)", async () => {
    // The unit test for the install-failure path calls
    // `runInstall` without a signal. The mock seam is the
    // install-run.ts side; here we exercise the actual
    // function with `signal: undefined`.
    const command = {
      bin: process.execPath,
      args: ["-e", "process.exit(0)"],
    }
    const result = await runInstall({
      command,
      managerId: "pnpm",
      cwd: process.cwd(),
    })
    expect(result.ok).toBe(true)
  })

  it("the install command factory produces a valid InstallCommand shape (regression: pnpm.installCommand)", () => {
    // The pnpm install command factory is the canonical
    // source of InstallCommand values. This test pins
    // the shape so a future change to the factory is
    // caught here, not in the production path.
    const cmd = pnpm.installCommand("corepack", "11.0.0")
    expect(cmd.bin).toBe("corepack")
    expect(cmd.args).toEqual(["pnpm", "install"])
  })
})
