import { spawn } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_BINARY = resolve(__dirname, "../../dist/index.js")

export type CliResult = {
  stdout: string
  stderr: string
  exitCode: number
}

export type RunCliOptions = {
  cwd?: string
  env?: NodeJS.ProcessEnv
  /** Override the binary path. Defaults to apps/cli/dist/index.js. */
  binaryPath?: string
}

export const runCli = async (
  args: string[],
  options: RunCliOptions = {},
): Promise<CliResult> => {
  const { cwd, env, binaryPath = DEFAULT_BINARY } = options
  return new Promise((resolveFn, rejectFn) => {
    const child = spawn("node", [binaryPath, ...args], {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on("error", rejectFn)
    child.on("exit", (code) => {
      resolveFn({ stdout, stderr, exitCode: code ?? 1 })
    })
  })
}
