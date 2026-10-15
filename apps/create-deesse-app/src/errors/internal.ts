import { CliError } from "./index.js"

export const internal = (detail: string): CliError =>
  new CliError("internal", `unexpected internal error: ${detail}`, detail)