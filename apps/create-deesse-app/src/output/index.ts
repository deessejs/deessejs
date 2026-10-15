import pc from "picocolors"

import type { CliError } from "../errors/index.js"

// printResult writes one JSON object to stdout and returns. It does NOT call
// process.exit() — the caller in src/index.ts sets process.exitCode and lets
// the runtime drain stdio naturally. This avoids the trap where process.exit()
// after process.stdout.write() truncates the JSON because the buffer hasn't
// flushed.
export const printResult = (result: unknown): void => {
  process.stdout.write(JSON.stringify(result, null, 2) + "\n")
}

// printError writes a human-readable error to stderr (red Error: line, dimmed
// Hint: line, dimmed Code: line). It does NOT call process.exit().
export const printError = (err: CliError): void => {
  process.stderr.write(
    `${pc.red("Error")}: ${err.message}\n` +
      (err.hint ? `${pc.dim("Hint")}: ${err.hint}\n` : "") +
      `${pc.dim("Code")}: ${err.code}\n`,
  )
}