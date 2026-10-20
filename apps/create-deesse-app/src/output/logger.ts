import pc from "picocolors"

const PREFIX = "create-deesse-app:"

/**
 * A small structured-logging seam used by `--verbose` to print
 * human-readable progress to stderr.
 *
 * The interface is intentionally minimal so tests can mock it
 * with a single `vi.fn()` per method. The default
 * implementation (`nullLogger`) discards every call; the
 * opt-in implementation (`stderrLogger`) writes one line per
 * call to `process.stderr`, prefixed with `create-deesse-app:`
 * and tagged with the level (`info` / `warn` / `error`).
 *
 * The output is designed to be human-first: scripts that want
 * the structured contract continue to read the single JSON
 * object on stdout. The logger never writes to stdout; the
 * `nullLogger`/`stderrLogger` distinction is the only branch
 * the pipeline cares about.
 */
/**
 * The shape of the optional `fields` argument the logger
 * carries on every call. Hoisted to a type alias so the
 * three Logger methods share one definition.
 */
type LogFields = Record<string, string | number | boolean>

export interface Logger {
  info: (event: string, fields?: LogFields) => void
  warn: (event: string, fields?: LogFields) => void
  error: (event: string, fields?: LogFields) => void
}

type Level = "info" | "warn" | "error"

const MARKER: Record<Level, string> = {
  info: "",
  warn: " (!)",
  error: " (x)",
}

const dim = (s: string): string => (pc.isColorSupported ? `\x1b[2m${s}\x1b[22m` : s)

const renderFields = (fields: LogFields): string => {
  const parts: string[] = []
  for (const [k, v] of Object.entries(fields)) {
    const s = String(v)
    parts.push(s.includes(" ") || s.includes("=") ? `${k}='${s}'` : `${k}=${s}`)
  }
  return parts.length > 0 ? " " + parts.join(" ") : ""
}

/**
 * Build a `Logger` that writes nothing. Used when the user
 * did not pass `--verbose`; the cost is one virtual call per
 * pipeline event, which is negligible.
 */
export const nullLogger: Logger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
}

/**
 * Build a `Logger` that writes one line per call to
 * `process.stderr`. The `writer` argument is injectable so
 * unit tests can capture lines without redirecting
 * `process.stderr` globally.
 */
export const stderrLogger = (writer: (s: string) => void = process.stderr.write.bind(process.stderr)): Logger => {
  const make = (level: Level) =>
    (event: string, fields?: LogFields): void => {
      const rendered = fields ? renderFields(fields) : ""
      const marker = MARKER[level]
      // The prefix carries the colon; the colon is part of
      // the visible marker, not a separator, so it lives
      // inside the dim span (so the colon is dimmed with
      // the rest of the prefix on color-capable terminals).
      writer(`${dim(PREFIX)}${marker} ${event}${rendered}\n`)
    }
  return {
    info: make("info"),
    warn: make("warn"),
    error: make("error"),
  }
}
