import { CliError } from "./index.js"

export const networkError = (detail: string): CliError =>
  new CliError(
    "network_error",
    "network request failed",
    detail,
  )