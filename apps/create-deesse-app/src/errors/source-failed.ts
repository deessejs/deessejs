import { CliError } from "./index.js"

export const sourceFailed = (detail: string): CliError =>
  new CliError(
    "source_failed",
    "could not resolve template source",
    detail,
  )

export const gitNotInstalled = (): CliError =>
  new CliError(
    "source_failed",
    "`git` is not installed or not on PATH",
    "install git from https://git-scm.com and try again",
  )