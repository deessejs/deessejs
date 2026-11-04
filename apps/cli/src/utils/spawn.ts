import * as crossSpawn from "cross-spawn"

// Dummy comment added to exercise the CI workflows on a no-op change.
// No runtime behavior change; tests and bundle are unaffected.

export type SpawnOptions = {
  cwd?: string
  env?: NodeJS.ProcessEnv
  stdio?: "inherit" | "pipe" | "ignore"
  /** If true, do not throw on non-zero exit codes. Default is `true` (no throw). */
  reject?: boolean
}

export type SpawnResult = { code: number | null; signal: NodeJS.Signals | null }

/**
 * Starts a subprocess with an argv array and reports both its exit code and
 * terminating signal. This variant is used when callers must distinguish a
 * normal failure from cancellation and need to choose the correct recovery
 * behavior. Windows command shims are resolved by `cross-spawn`; shell parsing
 * remains disabled. With `stdio: "pipe"`, child output is forwarded to stderr
 * so structured stdout from the parent command is preserved.
 *
 * @param command - Executable name or path.
 * @param args - Individual arguments passed to the executable.
 * @param options - Optional working directory, environment, and stdio policy.
 * @returns Exit code and signal; a signal termination has a null exit code.
 * @throws If the process cannot be started.
 */
export const spawnResult = (
  command: string,
  args: string[],
  options: Omit<SpawnOptions, "reject"> = {}
): Promise<SpawnResult> => {
  const { cwd, env, stdio = "inherit" } = options
  return new Promise((resolve, rejectFn) => {
    const child = crossSpawn.spawn(command, args, {
      cwd,
      env: env ?? process.env,
      stdio: stdio === "pipe" ? ["ignore", "pipe", "pipe"] : stdio,
      shell: false,
    })
    if (stdio === "pipe") {
      child.stdout?.pipe(process.stderr)
      child.stderr?.pipe(process.stderr)
    }
    child.on("error", rejectFn)
    child.on("exit", (code, signal) => resolve({ code, signal }))
  })
}

/**
 * Starts a subprocess and resolves with its exit code. Non-zero exits are
 * values by default; callers may opt into rejection with `reject: true`. A
 * spawn error rejects regardless of that option. The function uses argv-based
 * execution with shell processing disabled and cross-platform command-shim
 * resolution.
 *
 * @param command - Executable name or path.
 * @param args - Individual arguments passed to the executable.
 * @param options - Working directory, environment, stdio, and exit policy.
 * @returns Child exit code, normalized to `1` when terminated by a signal.
 * @throws If the process cannot be started or if `reject` is true and it exits
 * with a non-zero code.
 */
export const spawn = (
  command: string,
  args: string[],
  options: SpawnOptions = {}
): Promise<number> => {
  const { cwd, env, stdio = "inherit", reject = false } = options
  return new Promise((resolve, rejectFn) => {
    // `cross-spawn` resolves Windows `.cmd`/`.bat` shims automatically
    // (PATHEXT), unlike `node:child_process#spawn` with `shell: false`.
    const child = crossSpawn.spawn(command, args, {
      cwd,
      env: env ?? process.env,
      stdio: stdio === "pipe" ? ["ignore", "pipe", "pipe"] : stdio,
      shell: false,
    })
    if (stdio === "pipe") {
      child.stdout?.pipe(process.stderr)
      child.stderr?.pipe(process.stderr)
    }
    child.on("error", (err) => rejectFn(err))
    child.on("exit", (code) => {
      const exit = code ?? 1
      if (reject && exit !== 0) {
        rejectFn(new Error(`${command} exited with code ${exit}`))
      } else {
        resolve(exit)
      }
    })
  })
}
