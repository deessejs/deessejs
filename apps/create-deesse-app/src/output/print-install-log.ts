import pc from "picocolors"

const MAX_BYTES = 32 * 1024

export type PrintInstallLogArgs = {
  /** Process exit code (non-zero). */
  code: number
  /** Captured stdout from the install command. */
  stdout: string
  /** Captured stderr from the install command. */
  stderr: string
  /** Recovery command the user can run to retry. */
  recovery: string
  /** Path to the project on disk. */
  destination: string
}

/**
 * Write a human-readable, truncated dump of the install output to stderr
 * when `pnpm install` (or any future PackageManager) exits non-zero.
 *
 * The contract is:
 *   - JSON on stdout stays the single source of truth for scripts;
 *   - this function writes only to stderr, never stdout;
 *   - the captured `stderr` and `stdout` are truncated to MAX_BYTES each,
 *     with a clear marker when the rest is dropped.
 *
 * `printError` continues to handle the human line for CLI errors. The two
 * are complementary: this helper gives the user the actual install output,
 * which `printError` deliberately does not.
 */
export const printInstallLog = (args: PrintInstallLogArgs): void => {
  const { code, stdout, stderr, recovery, destination } = args
  const prefix = pc.dim("[create-deesse-app]")

  const lines: string[] = []
  lines.push(`${prefix} ${pc.bold(`pnpm install exited with code ${code}`)}`)
  lines.push(`${prefix} ${pc.dim(`project on disk at: ${destination}`)}`)
  lines.push(`${prefix} ${pc.dim("--- stderr ---")}`)
  lines.push(truncate(stderr))
  lines.push(`${prefix} ${pc.dim("--- stdout ---")}`)
  lines.push(truncate(stdout))
  lines.push(`${prefix} ${pc.dim("--- recovery ---")}`)
  lines.push(recovery)

  process.stderr.write(lines.join("\n") + "\n")
}

const truncate = (input: string): string => {
  if (input.length <= MAX_BYTES) return input
  const drop = input.length - MAX_BYTES
  return (
    input.slice(0, MAX_BYTES) +
    `\n... (truncated, ${drop} more byte${drop === 1 ? "" : "s"} dropped) ...`
  )
}
