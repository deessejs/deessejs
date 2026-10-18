import { quoteForShell, quoteForCmd } from "./quote.js"
import type { InstallCommand } from "../pm/manager.js"

/**
 * Build the recovery command the user can paste to retry the
 * install. The shape of the command depends on the platform:
 *
 *  - On POSIX, we use `cd '<path>' && <bin> '<arg1>' '<arg2>' ...`.
 *    The shared `quoteForShell` helper escapes single quotes,
 *    backslashes, `$`, and other shell metacharacters, so a path
 *    with spaces, single quotes, or `$` characters round-trips
 *    through `sh -c` without losing any character. Every argument
 *    is quoted; the `bin` and the `args` are joined by spaces and
 *    each piece is independently escaped.
 *
 *  - On Windows, we use `cd /d "<path>" && "<bin>" "<arg1>" ...`
 *    which is `cmd`-compatible. `cmd` does not honor single
 *    quotes; double quotes are the only portable quoting. The
 *    `quoteForCmd` helper escapes embedded double quotes and
 *    caret metacharacters. Users on native `cmd` can paste the
 *    command directly; users on git bash or WSL should use the
 *    POSIX form (`process.platform !== "win32"`).
 *
 * Neither form ever interpolates a user-controlled string into
 * a shell command without going through one of these two
 * helpers. The pnpm version read from the generated project's
 * `packageManager` field is also routed through the helpers,
 * which closes the shell-injection vector that an unvalidated
 * version suffix would otherwise open.
 */
export const recoveryCommand = (args: {
  command: InstallCommand
  cwd: string
}): string => {
  const { command, cwd } = args
  const quote = process.platform === "win32" ? quoteForCmd : quoteForShell
  const cd = process.platform === "win32" ? "cd /d" : "cd"
  const cmdStr = [command.bin, ...command.args].map(quote).join(" ")
  return `${cd} ${quote(cwd)} && ${cmdStr}`
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
 * Each component (cwd, version) is routed through the shared
 * quoting helper appropriate for the host shell, so the
 * recovery command is safe to paste even if a future template
 * revision introduces a `packageManager` field with shell
 * metacharacters in the version.
 */
export const recoveryCommandForNoInstall = (args: {
  version: string
  cwd: string
}): string => {
  const { version, cwd } = args
  const quote = process.platform === "win32" ? quoteForCmd : quoteForShell
  const cd = process.platform === "win32" ? "cd /d" : "cd"
  return `${cd} ${quote(cwd)} && npm exec --yes -- pnpm@${quote(version)} install`
}
