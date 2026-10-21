/**
 * Quote a value as a PowerShell single-quoted string literal.
 * Single quotes inside a literal are doubled. Backslashes, dollar
 * signs, and other metacharacters remain literal inside the quotes.
 */
export const quoteForPowerShell = (value: string): string =>
  `'${value.replace(/'/g, "''")}'`

/**
 * POSIX single-quote a string for safe inclusion in a shell
 * command. The empty string is rendered as `''`.
 */
export const quoteForShell = (value: string): string => {
  if (value === "") return "''"
  return `'${value.replace(/'/g, "'\\''")}'`
}
