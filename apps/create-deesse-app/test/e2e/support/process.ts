import { spawn } from "node:child_process"

export type CommandResult = {
  exitCode: number
  signal: NodeJS.Signals | null
  stdout: string
  stderr: string
  durationMs: number
  /** Wall-clock time the process was spawned, ISO format. */
  startedAt: string
  /** Wall-clock time the process exited, ISO format. */
  exitedAt: string
}

export type RunCommandOptions = {
  cwd?: string
  env?: NodeJS.ProcessEnv
  /** Hard deadline; the process is killed (SIGTERM, then SIGKILL after 5 s) past this. */
  timeoutMs: number
  /** Where to write the captured streams. Defaults to in-memory strings. */
  onStdout?: (chunk: string) => void
  onStderr?: (chunk: string) => void
}

/**
 * Run a host-side command to completion, capturing stdout/stderr
 * separately, with a hard deadline. Used by the harness for steps the
 * monorepo itself runs (packing the CLI, computing digests, etc.) —
 * NOT for commands inside the consumer container; those go through
 * Testcontainers' `exec` and use a different helper.
 *
 * The event wiring uses the "attach listeners before scheduling" pattern
 * so a child that exits synchronously after spawn (e.g. ENOENT) does
 * not race the listener registration. A race here would surface as
 * the promise hanging until the timeout, returning exit code 124
 * instead of the real 127.
 */
export const runCommand = async (
  command: string,
  args: readonly string[],
  options: RunCommandOptions
): Promise<CommandResult> => {
  const startedAt = new Date()
  // On Windows, .cmd / .bat shims (e.g. pnpm.cmd) cannot be spawned
  // directly with shell:false — Node refuses with EINVAL. Use the
  // shell to dispatch the shim on Windows; elsewhere keep
  // shell:false so a stray shell never hides argument syntax
  // errors. The args are all author-controlled (paths and pnpm
  // flags) so the shell-expansion risk is bounded.
  const useShell = process.platform === "win32"
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    stdio: ["ignore", "pipe", "pipe"],
    shell: useShell,
    windowsHide: true,
  })

  let stdout = ""
  let stderr = ""
  child.stdout?.on("data", (chunk: Buffer | string) => {
    const s = typeof chunk === "string" ? chunk : chunk.toString("utf8")
    stdout += s
    options.onStdout?.(s)
  })
  child.stderr?.on("data", (chunk: Buffer | string) => {
    const s = typeof chunk === "string" ? chunk : chunk.toString("utf8")
    stderr += s
    options.onStderr?.(s)
  })

  // Listeners are attached before await; the Promise body just
  // resolves whichever settles first.
  const exited = new Promise<{
    code: number | null
    signal: NodeJS.Signals | null
    spawnError: Error | null
  }>((resolveFn) => {
    let settled = false
    const settle = (value: {
      code: number | null
      signal: NodeJS.Signals | null
      spawnError: Error | null
    }) => {
      if (settled) return
      settled = true
      resolveFn(value)
    }
    child.on("exit", (code, signal) => {
      settle({
        code,
        signal: signal as NodeJS.Signals | null,
        spawnError: null,
      })
    })
    child.on("error", (err) => {
      // ENOENT or other spawn-time failure. Treat as exit code 127
      // (standard "command not found") so the harness can distinguish
      // "binary not present" from "binary ran and returned non-zero".
      stderr += `${err.message}\n`
      settle({ code: 127, signal: null, spawnError: err })
    })
  })

  const timeout = new Promise<{
    code: number | null
    signal: NodeJS.Signals | null
    spawnError: Error | null
  }>((resolveFn) => {
    setTimeout(() => {
      // SIGTERM, then SIGKILL after 5s. The exit handler above
      // will then settle the `exited` promise with the actual
      // code, but we resolve the race here with a conventional
      // timeout exit code so the caller can react quickly.
      try {
        child.kill("SIGTERM")
      } catch {
        // already dead
      }
      setTimeout(() => {
        try {
          child.kill("SIGKILL")
        } catch {
          // already dead
        }
      }, 5_000).unref()
      resolveFn({ code: 124, signal: "SIGKILL", spawnError: null })
    }, options.timeoutMs).unref()
  })

  const t0 = Date.now()
  const winner = await Promise.race([exited, timeout])
  const exitedAt = new Date()
  return {
    exitCode: winner.code ?? 1,
    signal: winner.signal,
    stdout,
    stderr,
    durationMs: Date.now() - t0,
    startedAt: startedAt.toISOString(),
    exitedAt: exitedAt.toISOString(),
  }
}
