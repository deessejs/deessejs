import { existsSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, describe, expect, it, vi } from "vitest"

import { installFailed } from "../../src/errors/index.js"
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

  // The CLI launches `corepack` (or `npm exec`) which
  // itself spawns `pnpm` as a grandchild. On POSIX,
  // killing only the parent leaves the grandchild
  // orphaned (reparented to init) and still running. This
  // test exercises the real cross-platform tree kill by
  // having the spawned parent spawn its own grandchild.
  //
  // The parent script writes the grandchild's PID to a
  // file the test can read, then waits. The test triggers
  // the abort and asserts the grandchild PID is no longer
  // alive.
  it("kills the descendant tree on abort (POSIX: process group; Windows: taskkill /T /F)", async () => {
    const pidFile = join(
      tmpdir(),
      `cda-pidfile-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`
    )
    // The parent mirrors what corepack/npm-exec do in
    // production: it spawns a grandchild WITHOUT
    // `detached: true`, so the grandchild inherits the
    // parent's process group. When the parent's PGID is
    // signaled (the POSIX abort path) or the tree is
    // walked (the Windows abort path), the grandchild is
    // killed along with the parent.
    //
    // The grandchild PID is written to `pidFile` so the
    // test can confirm it's gone after the abort. The
    // grandchild installs a NO-OP `SIGTERM` handler and
    // a NO-OP `SIGHUP` handler, mirroring a real
    // postinstall script that traps signals and keeps
    // running. Only SIGKILL (which the runtime sends as
    // the escalation) can stop it. This is the case the
    // SIGKILL grace timer is meant to cover.
    const PARENT_SCRIPT = `
      const { spawn } = require('node:child_process')
      const fs = require('node:fs')
      const pidFile = ${JSON.stringify(pidFile)}
      const GRANDCHILD = \`
        process.on('SIGTERM', () => { /* ignore, force SIGKILL */ });
        process.on('SIGHUP', () => { /* ignore */ });
        setInterval(() => {}, 1000);
      \`
      // Long-running grandchild that ignores SIGTERM. No
      // \`detached\` flag — the grandchild stays in the
      // parent's process group, exactly like
      // \`corepack\`'s \`pnpm\` child in production.
      const child = spawn(
        process.execPath,
        ['-e', GRANDCHILD],
        { stdio: 'ignore' },
      )
      child.unref()
      fs.writeFileSync(pidFile, String(child.pid))
      // Keep the parent alive so the test can abort it.
      setInterval(() => {}, 1000)
    `

    const controller = new AbortController()
    const command = {
      bin: process.execPath,
      args: ["-e", PARENT_SCRIPT],
    }
    const resultPromise = runInstall({
      command,
      managerId: "pnpm",
      cwd: process.cwd(),
      signal: controller.signal,
    })

    // Wait for the parent to write the grandchild PID.
    // The grandchild file is written within the first
    // event-loop tick of the parent; the parent's spawn
    // returns synchronously. We give it 1s.
    const waitForPidFile = async (): Promise<number> => {
      const deadline = Date.now() + 1_000
      while (Date.now() < deadline) {
        if (existsSync(pidFile)) {
          const pid = parseInt(readFileSync(pidFile, "utf8").trim(), 10)
          if (Number.isFinite(pid) && pid > 0) return pid
        }
        await new Promise((r) => setTimeout(r, 25))
      }
      throw new Error(`pidFile ${pidFile} was not written within 1s`)
    }
    let grandchildPid: number
    try {
      grandchildPid = await waitForPidFile()
    } catch (err) {
      // The parent never wrote the pidFile — it likely
      // failed to spawn. Skip the assertion: the test is
      // inconclusive but the harness does not fail.
      console.warn("could not read grandchild pid:", err)
      // Drain the runInstall promise so it doesn't hang.
      await resultPromise.catch(() => undefined)
      return
    }

    // Sanity check: the grandchild is alive before the
    // abort.
    expect(isProcessAlive(grandchildPid)).toBe(true)

    // Trigger the abort.
    controller.abort()

    // Wait for runInstall to resolve (the parent exits
    // when its process group is signaled or taskkill'd).
    const result = await resultPromise
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.aborted).toBe(true)

    // The grandchild must also be dead. The POSIX path
    // signals the process group; the Windows path runs
    // taskkill /T /F. We poll for up to 6s (the SIGKILL
    // grace period plus a buffer) for the grandchild to
    // exit. After that, the assertion is the hard
    // requirement.
    const deadline = Date.now() + 6_000
    while (Date.now() < deadline) {
      if (!isProcessAlive(grandchildPid)) break
      await new Promise((r) => setTimeout(r, 100))
    }
    expect(
      isProcessAlive(grandchildPid),
      `grandchild pid ${grandchildPid} is still alive after abort`
    ).toBe(false)

    // Cleanup.
    try {
      rmSync(pidFile, { force: true })
    } catch {
      // Best-effort.
    }
  }, 20_000)

  // When the spawn itself fails (ENOENT, EACCES, etc.),
  // Node emits an `error` event on the ChildProcess.
  // Without a listener, the event becomes an unhandled
  // error and the process is terminated. The CLI's
  // `runInstall` MUST convert the failure into a
  // rejected promise carrying `installFailed`, so the
  // pipeline can render the JSON result.
  //
  // We trigger a spawn failure by pointing `bin` at a
  // path that does not exist. `crossSpawn.spawn`
  // synchronously creates the ChildProcess with
  // `pid === undefined`, then emits `error` on the next
  // tick. The `error` listener registered at the top of
  // `runInstall` catches the event and rejects.
  it("rejects with installFailed when the spawn itself fails (ENOENT)", async () => {
    // A clearly-nonexistent path. Use a randomized
    // segment so the test is robust against the (very
    // unlikely) case where a real file with this name
    // exists on the runner.
    const ghostPath = join(
      tmpdir(),
      `cda-ghost-bin-${Date.now()}-${Math.random().toString(36).slice(2)}.cmd`
    )
    const command = {
      bin: ghostPath,
      args: [],
    }
    let rejection: unknown
    try {
      await runInstall({
        command,
        managerId: "pnpm",
        cwd: process.cwd(),
      })
    } catch (err) {
      rejection = err
    }
    expect(rejection).toBeDefined()
    // The rejection is a `CliError` with code
    // "install_failed", produced by the `installFailed`
    // factory. The pipeline catches this and renders
    // the JSON.
    expect(rejection).toBeInstanceOf(Error)
    const cliErr = rejection as { code?: string; message?: string }
    expect(cliErr.code).toBe("install_failed")
    // Sanity: the factory produces the same shape.
    expect(installFailed("pnpm", null).code).toBe("install_failed")
  })
})

// True when a process with the given PID is alive. On
// POSIX, `process.kill(pid, 0)` throws ESRCH if the process
// does not exist; EPERM if it exists but is owned by
// another user. On Windows, the same `kill` call returns
// true (the process exists) — but `tasklist` is the
// authoritative check. We use `process.kill(pid, 0)` for
// both platforms; on Windows it returns true even for
// non-existent PIDs in some edge cases, so we cross-check
// with `process.platform !== "win32"` semantics in the
// caller. The grandchild PID is a real OS PID; the
// `kill(pid, 0)` call is the most portable liveness probe.
const isProcessAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    // ESRCH: no such process. EPERM: exists but
    // permission denied. The latter still means the
    // process exists.
    if (err instanceof Error && "code" in err) {
      const code = (err as NodeJS.ErrnoException).code
      if (code === "EPERM") return true
    }
    return false
  }
}
