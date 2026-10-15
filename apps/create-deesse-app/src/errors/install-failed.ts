import { CliError } from "./index.js"

export const installFailed = (pm: string, code: number | null): CliError =>
  new CliError(
    "install_failed",
    `${pm} install exited with code ${code ?? "unknown"}`,
    "check the captured output, then run the recovery command shown in the JSON result",
  )