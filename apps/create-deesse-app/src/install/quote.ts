/**
 * POSIX single-quote a string for safe inclusion in a shell
 * command. The strategy is the standard one: wrap the value in
 * single quotes, and replace every embedded single quote with
 * `'\''` (close, escape, reopen). The empty string is rendered
 * as `''`, which an empty argument under sh.
 *
 * Examples:
 *   quoteForShell("foo")                  -> "foo"
 *   quoteForShell("")                     -> "''"
 *   quoteForShell("foo bar")              -> "'foo bar'"
 *   quoteForShell("o'reilly")             -> "'o'\\''reilly'"
 *   quoteForShell("$1")                   -> "'$1'"
 *
 * The function is the only quoting primitive in the
 * install/recovery subsystem. The live install, the live
 * recovery, and the no-install recovery all use it; the unit
 * tests verify that the same helper is used everywhere.
 *
 * The recovery commands are intended to be pasted into a
 * POSIX-style shell. On Windows, `quoteForShell` still
 * produces POSIX output (single-quote), and the host's git
 * bash / WSL is the documented path for running the recovery.
 * The Windows `cmd` parser does not honor single quotes; we
 * do not try to emit cmd-shaped output here.
 */
export const quoteForShell = (s: string): string => {
  if (s === "") return "''"
  return `'${s.replace(/'/g, "'\\''")}'`
}
