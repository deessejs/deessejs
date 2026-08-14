import { CliError } from "./index.js"

export const networkError = (detail: string): CliError =>
  new CliError(
    "network_error",
    `could not reach the templates endpoint`,
    detail,
  )
