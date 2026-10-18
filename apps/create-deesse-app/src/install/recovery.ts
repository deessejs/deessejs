import { quoteForShell } from "./quote.js"
import type { InstallCommand } from "../pm/manager.js"

/**
 * Build the recovery command the user can paste to retry the
 * install. The shape is the same on every platform:
 *
 *   cd '<path>' && '<bin>' '<arg1>' '<arg2>' ...
 *
 * The path and every install-command argument are routed
 * through the shared `quoteForShell` helper, which produces
 * POSIX-compliant single-quote escaping. The recovery is
 * intended for git bash, WSL, or native sh on Windows. Users
 * on native `cmd` (PowerShell, the legacy cmd.exe) should
 * also use git bash or WSL because the cmd parser has
 * historical quirks that make a single-quoted form awkward to
 * use. The README documents this.
 *
 * We deliberately do NOT emit a `cmd` shape (e.g.
 * `cd /d "<path>" && ...`) because `cmd`'s argument parser
 * has known edge cases that defeat robust quoting (for
 * example, `cmd /c 'cd /d "C:\path with spaces"'` does not
 * work reliably on every `cmd` version). POSIX quoting is
 * portable across bash, zsh, fish, dash, and most
 * Unix-like shells; `cmd` quoting is not.
 *
 * The shell-injection vector is closed by the
 * `quoteForShell` helper: every component the user pastes
 * is independently quoted, including the pnpm version read
 * from the generated project's `packageManager` field.
 */
export const recoveryCommand = (args: {
  command: InstallCommand
  cwd: string
}): string => {
  const { command, cwd } = args
  const cmdStr = [command.bin, ...command.args].map(quoteForShell).join(" ")
  return `cd ${quoteForShell(cwd)} && ${cmdStr}`
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
 *
 * The recovery uses the same POSIX-shaped `cd '<path>' && ...`
 * form as the live install recovery; the rationale is the
 * same (cmd quoting is unreliable; POSIX quoting is portable).
 */
export const recoveryCommandForNoInstall = (args: {
  version: string
  cwd: string
}): string => {
  const { version, cwd } = args
  return `cd ${quoteForShell(cwd)} && npm exec --yes -- pnpm@${quoteForShell(version)} install`
}
