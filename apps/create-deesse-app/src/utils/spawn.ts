import * as crossSpawn from "cross-spawn"

export type SpawnOptions = {
  cwd?: string
  env?: NodeJS.ProcessEnv
  /** Default: "pipe". Use "inherit" only when the caller wants raw stdio passthrough. */
  stdio?: "inherit" | "pipe" | "ignore"
  /** If true, throw on non-zero exit codes. Default: false (resolve with code). */
  reject?: boolean
}

/**
 * Run a command and resolve with its exit code. Never throws on non-zero by
 * default; pass `reject: true` to opt into throwing.
 */
export const spawn = (
  command: string,
  args: string[],
  options: SpawnOptions = {},
): Promise<number> => {
  const { cwd, env, stdio = "pipe", reject = false } = options
  return new Promise((resolve, rejectFn) => {
    // `cross-spawn` resolves Windows `.cmd`/`.bat` shims automatically
    // (PATHEXT), unlike `node:child_process#spawn` with `shell: false`.
    const child = crossSpawn.spawn(command, args, {
      ...(cwd !== undefined ? { cwd } : {}),
      env: env ?? process.env,
      stdio,
      shell: false,
    })
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