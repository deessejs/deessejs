import { quoteForShell } from "./quote.js"
import type { InstallCommand } from "../pm/manager.js"

/**
 * Build the literal recovery command users run when install
 * failed or was skipped via `--no-install`. Uses `cd /d <path> && ...`
 * on Windows, `cd <path> && ...` elsewhere, so the command works
 * whether the user is in the parent directory or somewhere else.
 *
 * The path and each command argument are quoted with the shared
 * `quoteForShell` helper, which is the only quoting primitive in
 * the install/recovery subsystem. A path with spaces, single
 * quotes, or `$` characters round-trips through `sh -c` without
 * losing any character.
 */
export const recoveryCommand = (args: {
  command: InstallCommand
  cwd: string
}): string => {
  const { command, cwd } = args
  const cmdStr = [command.bin, ...command.args].join(" ")
  const cd = process.platform === "win32" ? "cd /d" : "cd"
  return `${cd} ${quoteForShell(cwd)} && ${cmdStr}`
}

/**
 * The deterministic recovery command for the `--no-install`
 * path. There is no probing: the choice is fixed to
 * `npm exec --yes -- pnpm@<version> install`, which is the one
 * bootstrap that works on every supported Node (22.13+) without
 * depending on corepack or whatever pnpm happens to be on the
 * user's `PATH`. The `version` is read from the generated
 * project's `packageManager` field by `readGeneratedPnpmVersion`.
 *
 * The function takes a `version` argument rather than reading
 * from disk so the unit test can pass an arbitrary version
 * without depending on the real template's `packageManager`
 * field. Callers in the pipeline pass
 * `readGeneratedPnpmVersion(state.input.dir)` as the value.
 */
export const recoveryCommandForNoInstall = (args: {
  version: string
  cwd: string
}): string => {
  const { version, cwd } = args
  const cd = process.platform === "win32" ? "cd /d" : "cd"
  return `${cd} ${quoteForShell(cwd)} && npm exec --yes -- pnpm@${quoteForShell(version)} install`
}
