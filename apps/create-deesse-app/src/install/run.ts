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
  | { ok: false; aborted: true; code: number | null; stderr: string; stdout: string }

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
 * When `signal` is provided and fires mid-flight, the child
 * is killed (SIGTERM, then SIGKILL after a grace period) and
 * the promise resolves with `{ ok: false, aborted: true, ... }`
 * — the caller's `aborted` branch then routes to
 * `error.code: "aborted"` rather than `install_failed`.
 *
 * On non-zero, the child.on('error') handler also throws
 * `installFailed` so the caller's error path surfaces the
 * correct code (`install_failed`) in the JSON result. The
 * result of `runInstall` and the throw are paired: the
 * caller catches the throw, then prints its JSON with
 * `projectCreated: true` + `recovery`.
 */
export const runInstall = async (args: RunInstallArgs): Promise<RunInstallResult> => {
  const { command, managerId, cwd, signal } = args
  const cmd = command

  return new Promise<RunInstallResult>((resolveFn, rejectFn) => {
    const child = crossSpawn.spawn(cmd.bin, cmd.args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    })

    let stdout = ""
    let stderr = ""
    // Set by the abort listener. Read by the exit listener
    // to decide between `aborted: true` and a normal
    // `code: <exit>`. The flag is set BEFORE the kill
    // signal is sent, so even if the child exits between
    // the kill and the exit event, we route to `aborted`.
    let aborted = false
    let killTimer: ReturnType<typeof setTimeout> | null = null

    child.stdout?.on("data", (chunk: Buffer | string) => {
      stdout += typeof chunk === "string" ? chunk : chunk.toString("utf8")
    })
    child.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += typeof chunk === "string" ? chunk : chunk.toString("utf8")
    })

    const onAbort = (): void => {
      aborted = true
      try {
        child.kill("SIGTERM")
      } catch {
        // Already dead; nothing to do.
      }
      killTimer = setTimeout(() => {
        try {
          child.kill("SIGKILL")
        } catch {
          // Already dead; nothing to do.
        }
      }, KILL_GRACE_MS)
    }

    if (signal) {
      if (signal.aborted) {
        onAbort()
      } else {
        signal.addEventListener("abort", onAbort, { once: true })
      }
    }

    child.on("error", () => {
      // ENOENT etc. — the binary isn't installed. Treat as install failure.
      if (signal) signal.removeEventListener("abort", onAbort)
      if (killTimer) clearTimeout(killTimer)
      rejectFn(installFailed(managerId, null))
    })
    child.on("exit", (code) => {
      if (signal) signal.removeEventListener("abort", onAbort)
      if (killTimer) clearTimeout(killTimer)
      if (aborted) {
        resolveFn({
          ok: false,
          aborted: true,
          code: code ?? null,
          stderr,
          stdout,
        })
        return
      }
      const exit = code ?? 1
      if (exit === 0) {
        resolveFn({ ok: true })
      } else {
        resolveFn({ ok: false, aborted: false, code: exit, stderr, stdout })
      }
    })
  })
}
