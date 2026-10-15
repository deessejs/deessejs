import { CliError } from "./index.js"

export const invalidName = (name: string, reason: string): CliError =>
  new CliError(
    "invalid_name",
    `project name "${name}" is not valid (${reason})`,
    "use a lowercase, dash-separated name with no leading dot or underscore (max 214 chars)",
  )