import { isAbsolute } from "node:path"

import type { PackageManager } from "../pm/manager.js"

/**
 * Build the literal recovery command users run when install failed or was
 * skipped via `--no-install`. Uses `cd /d <path> && ...` on Windows,
 * `cd <path> && ...` elsewhere, so the command works whether the user is in
 * the parent directory or somewhere else.
 */
export const recoveryCommand = (args: {
  manager: PackageManager
  cwd: string
}): string => {
  const { manager, cwd } = args
  const cmd = manager.installCommand()
  const cmdStr = [cmd.bin, ...cmd.args].join(" ")
  const cd = process.platform === "win32" ? "cd /d" : "cd"
  const target = isAbsolute(cwd) ? cwd : `"${cwd}"` // quote relative paths with spaces
  return `${cd} ${target} && ${cmdStr}`
}