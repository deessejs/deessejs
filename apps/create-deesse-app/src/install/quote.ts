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

/**
 * Windows `cmd`-compatible double-quote a string. `cmd` does
 * not honor single quotes; double quotes are the only portable
 * quoting.
 *
 * The escaping rules below are the ones Microsoft documents
 * for `cmd` and that the round-trip test in `quote.test.ts`
 * exercises:
 *
 *  - inside a double-quoted argument, `cmd` treats `& | < > ( )`
 *    as literal — they need no escape. So we do not prefix
 *    them with `^`.
 *  - `^` itself, `%`, and `!` are still special inside double
 *    quotes. We escape them so a path containing them round-trips
 *    verbatim.
 *  - a literal double quote is escaped as `\"` (the
 *    documented way to embed a quote inside a double-quoted
 *    `cmd` argument).
 *
 * The empty string is rendered as `""`, which `cmd` treats as
 * an empty argument.
 *
 * This helper is used only on Windows (`process.platform ===
 * "win32"`) by the recovery-command builder. On POSIX the
 * shared `quoteForShell` is used instead; the two helpers are
 * never combined in a single command.
 *
 * Examples (on Windows):
 *   quoteForCmd("foo")        -> "foo"
 *   quoteForCmd("")           -> ""
 *   quoteForCmd("foo bar")    -> "foo bar"
 *   quoteForCmd("a\"b")       -> "a\"b"
 *   quoteForCmd("100%done")   -> "100%%done"
 *   quoteForCmd("a&b")        -> "a&b"   (literal inside double quotes)
 *   quoteForCmd("a^b")        -> "a^^b"
 *   quoteForCmd("a!b")        -> "a^^!b"
 */
export const quoteForCmd = (s: string): string => {
  if (s === "") return '""'
  // The order matters: backslash first (literal "), then
  // carets for the still-special chars, then `%` (which
  // is escaped by doubling inside a `cmd` batch file).
  // `& | < > ( )` are not special inside double quotes on
  // modern `cmd`; the round-trip test verifies this.
  const escaped = s
    .replace(/"/g, '\\"')
    .replace(/\^/g, "^^")
    .replace(/!/g, "^^!")
    .replace(/%/g, "%%")
  return `"${escaped}"`
}
