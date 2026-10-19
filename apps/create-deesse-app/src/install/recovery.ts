import { quoteForCmd, quoteForShell } from "./quote.js"
import type { InstallCommand } from "../pm/manager.js"

/**
 * True when the CLI is running on a Windows host. The
 * recovery-command builder uses this to choose between the
 * `cmd`-shaped form (Windows) and the POSIX-shaped form
 * (everywhere else). The choice is about the shell the user
 * will paste into on that host, not about Node's runtime.
 *
 * `process.platform` is a frozen string literal at module
 * load time; the check is a constant in the bundled CLI but
 * remains `process.platform`-driven in the unit tests so the
 * same test file exercises both branches via mocking.
 */
const isWindows = (): boolean => process.platform === "win32"

/**
 * Build the recovery command the user can paste to retry the
 * install. The shape depends on the host shell:
 *
 *  - POSIX (Linux, macOS, git bash on Windows): the
 *    `cd '<path>' && '<bin>' '<arg1>' '<arg2>' ...` form,
 *    quoted with `quoteForShell`. Every argument is
 *    independently single-quoted, including the pnpm version
 *    read from the generated project's `packageManager` field,
 *    so a future template revision with shell metacharacters
 *    in the version cannot inject commands.
 *
 *  - Windows `cmd` (the default PowerShell host, the legacy
 *    cmd.exe): the `cd /d "<path>" && "<bin>" "<arg1>" "<arg2>" ...`
 *    form, quoted with `quoteForCmd`. `cd /d` switches drives
 *    and directories in one command. Each argument is
 *    double-quoted with cmd's documented escapes for `^`,
 *    `!`, and `%`; `& | < > ( )` stay literal because they
 *    are not special inside double quotes on modern `cmd`.
 *
 * Why platform-aware and not one-shape-fits-all: a Windows
 * user running the CLI on Node Windows gets a destination
 * path like `C:\Users\foo\my-project`. Pasted into WSL that
 * path is unreachable as-is (WSL accesses the C drive via
 * `/mnt/c/...`, not via the `C:\...` form). Pasted into git
 * bash the POSIX form is fine, but git bash is not the
 * default terminal on Windows. So the recovery command
 * matches the shell the user is most likely on, and the
 * README points at the supported shells for each.
 */
export const recoveryCommand = (args: {
  command: InstallCommand
  cwd: string
}): string => {
  const { command, cwd } = args
  if (isWindows()) {
    const cmdStr = [command.bin, ...command.args].map(quoteForCmd).join(" ")
    return `cd /d ${quoteForCmd(cwd)} && ${cmdStr}`
  }
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
 * The shape matches `recoveryCommand` for the host platform:
 * POSIX on non-Windows, `cmd` on Windows.
 */
export const recoveryCommandForNoInstall = (args: {
  version: string
  cwd: string
}): string => {
  const { version, cwd } = args
  if (isWindows()) {
    return `cd /d ${quoteForCmd(cwd)} && npm exec --yes -- pnpm@${quoteForCmd(version)} install`
  }
  return `cd ${quoteForShell(cwd)} && npm exec --yes -- pnpm@${quoteForShell(version)} install`
}

/**
 * The recovery command for the user-triggered cancel path
 * (`error.code: "aborted"`). The user re-runs the same CLI
 * command, so the shape preserves the project name and the
 * flags that affect the run (custom `--dir`, `--no-install`).
 *
 * Three design choices:
 *
 *  - The command is **launcher-agnostic**. The original
 *    run may have been `pnpm dlx create-deesse-app@latest`
 *    or `npx create-deesse-app@latest` or `npm exec
 *    --yes -- create-deesse-app@latest` (all three are
 *    supported). We don't know which, so we don't prefix
 *    one. The user adds the launcher they used the first
 *    time. The README documents the three forms.
 *
 *  - There is **no `cd` prefix**. The cancel may have
 *    happened before `publishProject` ran, in which case
 *    the destination directory does not exist yet and a
 *    `cd <dir>` would fail before reaching the CLI. The
 *    user runs the recovery from the same cwd they used
 *    the first time. The CLI defaults `--dir` to
 *    `./<projectName>` (relative to cwd) when the flag is
 *    absent, so the canonical paste form works without
 *    any path prefix.
 *
 *  - The shape is **platform-agnostic**. The original
 *    round-1 helper did POSIX-vs-cmd quoting, but the
 *    only "argument" we emit is the project name (no
 *    spaces, no shell metacharacters) plus a `--dir <path>`
 *    flag when the user passed a custom path. The
 *    project name is `lowercase-dash-separated` per the
 *    `validateProjectName` rule and never contains
 *    characters that would require quoting. A custom
 *    `--dir` is passed verbatim: the user knows their
 *    shell, and the recovery field is a hint, not a
 *    guaranteed-runnable command for every shell on every
 *    platform.
 *
 * The `@latest` tag is intentional: the original install
 * was interrupted before any state mutated, and re-running
 * against the original version pin would require the user
 * to remember which version they had. The CLI is at most
 * a few minutes old at this point (the user just installed
 * it), so `@latest` is the simplest re-entry point.
 */
export const recoveryCommandForReRun = (input: {
  projectName: string
  dir: string
  install: boolean
  defaultDir: string
}): string => {
  const parts: string[] = ["create-deesse-app@latest", input.projectName]
  // Preserve a custom --dir; drop the flag when the user
  // accepted the default (`./<projectName>`) so the
  // recovery matches what they typed the first time.
  if (input.dir !== input.defaultDir) {
    parts.push("--dir", input.dir)
  }
  // Preserve --no-install; drop the flag when the user
  // accepted the default (install runs).
  if (!input.install) {
    parts.push("--no-install")
  }
  // Deliberately drop --verbose. The recovery is the
  // minimum command that reproduces the original intent;
  // the user can re-add --verbose if they want narration.
  return parts.join(" ")
}
