import * as crossSpawn from "cross-spawn"

import { installFailed } from "../errors/index.js"
import type { InstallCommand } from "../pm/manager.js"

export type RunInstallResult =
  | { ok: true }
  | { ok: false; aborted: false; code: number; stderr: string; stdout: string }
  /**
   * The child was killed because the AbortSignal fired
   * before the child exited on its own. The `code` is the
   * child's exit code (often `null` when the process was
   * killed by `SIGTERM`); `stderr` and `stdout` carry
   * whatever the child wrote before the signal. The
   * pipeline routes this to `error.code: "aborted"`
   * with `projectCreated: true` (the project is on disk)
   * and the install recovery command, NOT the re-run form.
   *
   * The `aborted: true | false` literal is the
   * discriminator. The non-aborted failure variant sets
   * `aborted: false` so the union narrows cleanly on
   * `if (installResult.aborted)` checks.
   */
  | {
      ok: false
      aborted: true
      code: number | null
      stderr: string
      stdout: string
    }

export type RunInstallArgs = {
  /** The install command to run, produced by the strategy factory. */
  command: InstallCommand
  /** A short label for the install command, used in error messages. */
  managerId: string
  cwd: string
  /**
   * Optional signal that, when fired, kills the child
   * with `SIGTERM` (graceful) and then `SIGKILL` after
   * a 5-second grace period. The promise resolves with
   * the `aborted: true` variant of `RunInstallResult`,
   * NOT the `install_failed` variant, so the caller's
   * `aborted` branch fires.
   */
  signal?: AbortSignal
}

// How long to wait between SIGTERM and SIGKILL. pnpm
// typically exits within a few hundred milliseconds of
// SIGTERM; 5 seconds is generous. The timer is cleared
// as soon as the child exits cleanly.
const KILL_GRACE_MS = 5_000

/**
 * Run the install command in `cwd`. Captures stdout and stderr
 * separately so install log noise never leaks into our
 * JSON-on-stdout contract. Never throws on non-zero exit —
 * returns `{ ok: false, code, stderr, stdout }` so the caller
 * can decide whether to throw or to retain the project with a
 * recovery command.
 *
 * When `signal` is provided and fires mid-flight, the install
 * child AND its descendants are killed. The CLI launches
 * `corepack` (or `npm exec`), which itself spawns `pnpm` as a
 * grandchild. Killing only the immediate child would leave
 * the grandchild orphaned (on POSIX) and continuing to
 * mutate the project while the user reads the recovery
 * command. The cross-platform strategy:
 *
 *  - POSIX: spawn with `detached: true` so the child
 *    becomes the leader of a new process group. On abort,
 *    send the signal to the negative PID (the PGID) so the
 *    signal reaches every process in the group, including
 *    all descendants.
 *
 *  - Windows: there is no process group concept in the
 *    same way. `child.kill()` calls `TerminateProcess` on
 *    the immediate child. For descendants, shell out to
 *    `taskkill /T /F /PID <pid>` which walks the tree.
 *    `taskkill` is built into every supported Windows
 *    version; no new dep is required.
 *
 * The grace period (5s) between SIGTERM and SIGKILL still
 * applies: pnpm typically exits within a few hundred
 * milliseconds of SIGTERM, but the tree walk is the safety
 * net for stubborn grandchild processes.
 *
 * The promise resolves with `{ ok: false, aborted: true, ... }`
 * on cancel, NOT `{ ok: false, code, ... }`, so the caller's
 * `aborted` branch routes to `error.code: "aborted"` rather
 * than `install_failed`.
 *
 * On non-zero exit (NOT cancel), the child.on('error')
 * handler throws `installFailed` so the caller's error
 * path surfaces the correct code (`install_failed`) in the
 * JSON result. The result of `runInstall` and the throw are
 * paired: the caller catches the throw, then prints its
 * JSON with `projectCreated: true` + `recovery`.
 */
export const runInstall = async (
  args: RunInstallArgs
): Promise<RunInstallResult> => {
  const { command, managerId, cwd, signal } = args
  const cmd = command

  return new Promise<RunInstallResult>((resolveFn, rejectFn) => {
    // POSIX: detached:true creates a new process group with
    // pgid === child.pid. The negative-PID kill (below)
    // reaches every process in the group, including all
    // descendants (pnpm, postinstall scripts, etc.).
    // Windows: cross-spawn ignores `detached` on win32, so
    // we rely on `taskkill /T /F /PID` for tree termination
    // there.
    //
    // `cross-spawn`'s TypeScript types are a subset of
    // Node's `SpawnOptions` and do not include `detached`;
    // cast to the wider Node type so the field is
    // accepted without a noisy module-augmentation.
    const child = crossSpawn.spawn(cmd.bin, cmd.args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      ...(process.platform !== "win32" ? { detached: true } : {}),
    } as Parameters<typeof crossSpawn.spawn>[2])

    let stdout = ""
    let stderr = ""
    // Set by the abort listener. Read by the exit listener
    // to decide between `aborted: true` and a normal
    // `code: <exit>`. The flag is set BEFORE the kill
    // signal is sent, so even if the child exits between
    // the kill and the exit event, we route to `aborted`.
    let aborted = false
    // The SIGKILL grace timer. Kept alive AFTER the
    // immediate child exits, when the abort is in flight,
    // so a descendant that ignores SIGTERM is still
    // killed by the escalation. Cleared only when the
    // tree is verified empty (POSIX) or after a final
    // post-exit settle period (Windows).
    let killTimer: ReturnType<typeof setTimeout> | null = null
    // The post-exit poll: on POSIX, we wait until
    // `kill(-pgid, 0)` reports the group empty before
    // resolving. On Windows, we wait a short settle
    // period for descendants to die after taskkill.
    let pollTimer: ReturnType<typeof setTimeout> | null = null
    // Set to true once the promise has been resolved or
    // rejected. Prevents a late `error` event from
    // triggering a second resolution. The spawn-failure
    // case fires `error` without ever firing `exit`, so
    // we route the failure through `installFailed` and
    // short-circuit any other listener.
    let settled = false

    // The TypeScript type of `child.pid` is
    // `number | undefined`. Node assigns the pid
    // synchronously; on spawn failure (ENOENT etc.) the
    // pid is undefined and the `error` event fires
    // asynchronously. We narrow to a local const, but
    // the kill paths below guard on `pid !== undefined`
    // so a synchronous-spawn-failure does not throw a
    // `TypeError` before the `error` listener has a
    // chance to reject the promise.
    const pid = child.pid

    // The `error` listener MUST be attached before any
    // other code that may resolve the promise. If
    // `crossSpawn.spawn` fails synchronously (ENOENT,
    // EACCES, etc.), Node emits an `error` event on the
    // next tick; without a listener, the event becomes
    // an unhandled error and Node terminates the
    // process. We register the listener FIRST so the
    // failure is converted to an `install_failed`
    // rejection regardless of what other code paths
    // run after the spawn.
    child.on("error", () => {
      // ENOENT etc. — the binary isn't installed. Treat
      // as install failure. The `settled` flag prevents
      // a late `error` from clobbering a real `exit`-
      // driven resolution.
      if (settled) return
      settled = true
      if (signal) signal.removeEventListener("abort", onAbort)
      clearKillTimer()
      clearPollTimer()
      rejectFn(installFailed(managerId, null))
    })

    child.stdout?.on("data", (chunk: Buffer | string) => {
      stdout += typeof chunk === "string" ? chunk : chunk.toString("utf8")
    })
    child.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += typeof chunk === "string" ? chunk : chunk.toString("utf8")
    })

    // Kill the install child and its entire descendant
    // tree. See the long-form docstring above for the
    // platform rationale.
    const killTree = (sig: NodeJS.Signals | "SIGKILL"): void => {
      if (pid === undefined) {
        // Spawn failed; no tree to kill. The `error`
        // listener (registered below) will fire and
        // route the failure.
        return
      }
      if (process.platform === "win32") {
        // Windows: `child.kill()` calls `TerminateProcess`
        // on the immediate child. Then walk the tree with
        // taskkill so any grandchildren are also killed.
        // `taskkill` returns quickly; we don't wait for it.
        try {
          child.kill()
        } catch {
          // Already dead; nothing to do.
        }
        try {
          crossSpawn.spawn("taskkill", ["/T", "/F", "/PID", String(pid)], {
            stdio: "ignore",
            shell: false,
          })
        } catch {
          // taskkill missing: extremely unlikely on
          // win32, but the immediate-child kill above is
          // the best we can do.
        }
      } else {
        // POSIX: signal the process group. The negative
        // PID is the PGID; delivering a signal to -PGID
        // reaches every process in the group, including
        // descendants. The fallback (positive PID) is for
        // the rare case where the process group cannot be
        // signaled (e.g. it no longer exists because the
        // child exited cleanly before the abort landed).
        try {
          process.kill(-pid, sig)
        } catch {
          try {
            child.kill(sig)
          } catch {
            // Already dead; nothing to do.
          }
        }
      }
    }

    // True when the process group is empty (POSIX). The
    // check is `kill(-pgid, 0)`: returns 0 if any process
    // in the group is alive, throws ESRCH if the group
    // has no living members. We use this to decide when
    // the post-exit polling loop can stop and let
    // `runInstall` resolve.
    const isGroupEmpty = (): boolean => {
      if (process.platform === "win32") return true
      if (pid === undefined) return true // spawn never produced a pid
      try {
        process.kill(-pid, 0)
      } catch (err) {
        // ESRCH = group empty. EPERM or anything else
        // = assume non-empty so we keep waiting. Better
        // to wait too long than to resolve with a live
        // grandchild.
        if (
          err instanceof Error &&
          "code" in err &&
          (err as NodeJS.ErrnoException).code === "ESRCH"
        ) {
          return true
        }
      }
      return false
    }

    const clearKillTimer = (): void => {
      if (killTimer) {
        clearTimeout(killTimer)
        killTimer = null
      }
    }
    const clearPollTimer = (): void => {
      if (pollTimer) {
        clearTimeout(pollTimer)
        pollTimer = null
      }
    }

    const onAbort = (): void => {
      aborted = true
      killTree("SIGTERM")
      // The SIGKILL grace timer. We do NOT clear this
      // when the immediate child exits: a descendant
      // that ignores SIGTERM must still be killed by the
      // escalation. The timer is cleared only when the
      // group is verified empty (POSIX) or the post-exit
      // settle period ends (Windows). The timer is
      // idempotent: if `onAbort` fires more than once
      // (e.g. the user pressed Ctrl+C twice), the second
      // call resets the timer to a fresh grace period
      // rather than leaving the first timer in place.
      clearKillTimer()
      killTimer = setTimeout(() => killTree("SIGKILL"), KILL_GRACE_MS)
    }

    if (signal) {
      if (signal.aborted) {
        onAbort()
      } else {
        signal.addEventListener("abort", onAbort, { once: true })
      }
    }

    // The post-exit poll: only used on the abort path.
    // After the immediate child exits, we keep waiting
    // for the descendant tree to die (POSIX) or for a
    // short settle period to elapse (Windows). The
    // SIGKILL grace timer is NOT cleared here — the
    // escalation continues independently.
    const startPostExitPoll = (): void => {
      if (process.platform === "win32") {
        // Windows: we cannot cheaply enumerate the
        // process tree. Wait a short settle period (the
        // taskkill we already spawned in killTree is
        // async). 1 second is generous for descendants
        // to honor TerminateProcess / taskkill.
        pollTimer = setTimeout(() => {
          clearPollTimer()
          clearKillTimer()
          resolveFn({
            ok: false,
            aborted: true,
            code: null,
            stderr,
            stdout,
          })
        }, 1_000)
      } else {
        // POSIX: poll the process group. When it's
        // empty, resolve. The poll interval is 100ms —
        // fast enough that the user does not notice a
        // long resolve after a stubborn grandchild.
        const poll = (): void => {
          if (isGroupEmpty()) {
            clearPollTimer()
            clearKillTimer()
            resolveFn({
              ok: false,
              aborted: true,
              code: null,
              stderr,
              stdout,
            })
            return
          }
          // Re-signal: a process that was just created
          // (e.g. a child of a postinstall hook) or one
          // that was uninterruptible at the SIGTERM tick
          // is now reachable. The repeated signal is the
          // safety net.
          killTree("SIGTERM")
          pollTimer = setTimeout(poll, 100)
        }
        poll()
      }
    }

    child.on("exit", (code) => {
      if (signal) signal.removeEventListener("abort", onAbort)
      if (aborted) {
        // The immediate child is gone. The descendants
        // may not be. Start the post-exit poll: it
        // keeps the SIGKILL grace timer alive and
        // re-signals until the group is empty, then
        // resolves. We deliberately do NOT clear
        // `killTimer` here — see the long-form note
        // above. We also do NOT resolve yet.
        startPostExitPoll()
        return
      }
      // Non-aborted exit: clear timers, resolve
      // immediately with the standard shape.
      clearKillTimer()
      clearPollTimer()
      const exit = code ?? 1
      if (exit === 0) {
        resolveFn({ ok: true })
      } else {
        resolveFn({ ok: false, aborted: false, code: exit, stderr, stdout })
      }
    })
  })
}
