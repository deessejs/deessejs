import { spawn as nodeSpawn } from "node:child_process"

// Dummy comment added to exercise the CI workflows on a no-op change.
// No runtime behavior change; tests and bundle are unaffected.

export type SpawnOptions = {
  cwd?: string
  env?: NodeJS.ProcessEnv
  stdio?: "inherit" | "pipe" | "ignore"
  /** If true, do not throw on non-zero exit codes. Default is `true` (no throw). */
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
  const { cwd, env, stdio = "inherit", reject = false } = options
  return new Promise((resolve, rejectFn) => {
    const child = nodeSpawn(command, args, {
      cwd,
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