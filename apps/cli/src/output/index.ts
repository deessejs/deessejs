import pc from "picocolors"

import type { CliError } from "../errors/index.js"

export const printJson = (value: unknown): void => {
  process.stdout.write(JSON.stringify(value, null, 2) + "\n")
}

export const printError = (err: CliError): void => {
  process.stderr.write(
    `${pc.red("Error")}: ${err.message}\n` +
      (err.hint ? `${pc.dim("Hint")}: ${err.hint}\n` : "") +
      `${pc.dim("Code")}: ${err.code}\n`,
  )
}

export { printTemplatesTable, printTemplateInfo } from "./table.js"
