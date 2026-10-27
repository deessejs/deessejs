import { quoteForPowerShell, quoteForShell } from "./quote.js"
import type { InstallCommand } from "../pm/manager.js"

const isWindows = (): boolean => process.platform === "win32"

const commandString = (
  command: InstallCommand,
  quote: (value: string) => string
): string => [command.bin, ...command.args].map(quote).join(" ")

const changeDirectory = (
  cwd: string,
  isWindowsHost: boolean,
  quote: (value: string) => string
): string =>
  isWindowsHost
    ? `Set-Location -LiteralPath ${quote(cwd)}; &`
    : `cd ${quote(cwd)} &&`

/**
 * Build a recovery command for the user's default shell on the host.
 *
 * Windows users receive PowerShell syntax. The command uses PowerShell's
 * single-quoted literal rules, so paths and arguments are passed without
 * interpreting shell metacharacters. POSIX hosts receive a POSIX command.
 */
export const recoveryCommand = (args: {
  command: InstallCommand
  cwd: string
}): string => {
  const { command, cwd } = args
  const isWindowsHost = isWindows()
  const quote = isWindowsHost ? quoteForPowerShell : quoteForShell
  const prefix = changeDirectory(cwd, isWindowsHost, quote)
  return `${prefix} ${commandString(command, quote)}`
}

/**
 * Build the install retry command for the no-install recovery path.
 */
export const recoveryCommandForNoInstall = (args: {
  version: string
  cwd: string
}): string => {
  const { version, cwd } = args
  const isWindowsHost = isWindows()
  const quote = isWindowsHost ? quoteForPowerShell : quoteForShell
  const prefix = changeDirectory(cwd, isWindowsHost, quote)
  const command: InstallCommand = {
    bin: "npm",
    args: ["exec", "--yes", "--", `pnpm@${version}`, "install"],
  }
  return `${prefix} ${commandString(command, quote)}`
}

/**
 * Build the command that re-runs an interrupted create operation.
 */
export const recoveryCommandForReRun = (input: {
  projectName: string
  dir: string
  install: boolean
  defaultDir: string
}): string => {
  const parts: string[] = ["create-deesse-app@latest", input.projectName]
  if (input.dir !== input.defaultDir) {
    parts.push("--dir", input.dir)
  }
  if (!input.install) {
    parts.push("--no-install")
  }
  return parts.join(" ")
}
