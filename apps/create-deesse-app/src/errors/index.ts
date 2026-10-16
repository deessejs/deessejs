import { EXIT_ERROR } from "../constants/exit.js"

// Public surface: the closed list of error codes that downstream
// tooling may pattern-match against. Adding a code here is a breaking
// change.
export type CreateAppErrorCode =
  | "invalid_name"
  | "destination_exists"
  | "unsafe_archive"
  | "unsupported_manager"
  | "network_error"
  | "source_failed"
  | "install_failed"
  | "internal"

export class CliError extends Error {
  public readonly code: CreateAppErrorCode
  public readonly hint: string | undefined

  constructor(code: CreateAppErrorCode, message: string, hint?: string) {
    super(message)
    this.name = "CliError"
    this.code = code
    this.hint = hint
  }

  public exitCode = (): number => EXIT_ERROR
}

// Factories. Kept in this single file so the closed set of error codes,
// the class, and the canonical messages live together. Adding a new code
// means adding a constructor arm on CreateAppErrorCode above, then a
// factory here.
export const invalidName = (name: string, reason: string): CliError =>
  new CliError(
    "invalid_name",
    `project name "${name}" is not valid (${reason})`,
    "use a lowercase, dash-separated name with no leading dot or underscore (max 214 chars)",
  )

export const destinationExists = (dir: string): CliError =>
  new CliError(
    "destination_exists",
    `target directory "${dir}" already exists`,
    "remove the directory or pick a different --dir",
  )

export const unsafeArchive = (reasons: string[]): CliError =>
  new CliError(
    "unsafe_archive",
    `tarball rejected: ${reasons.length} unsafe ${reasons.length === 1 ? "entry" : "entries"}`,
    `first reason: ${reasons[0] ?? ""}`,
  )

export const unsupportedManager = (invoker: string): CliError =>
  new CliError(
    "unsupported_manager",
    `${invoker} is not a supported invocation manager for this increment`,
    `use "pnpm dlx create-deesse-app@latest <name>" instead`,
  )

export const networkError = (detail: string): CliError =>
  new CliError("network_error", "network request failed", detail)

export const sourceFailed = (detail: string): CliError =>
  new CliError(
    "source_failed",
    `could not resolve template source: ${detail}`,
    "check the network and that the repo URL is correct",
  )

export const gitNotInstalled = (): CliError =>
  new CliError(
    "source_failed",
    "`git` is not installed or not on PATH",
    "install git from https://git-scm.com and try again",
  )

export const installFailed = (pm: string, code: number | null): CliError =>
  new CliError(
    "install_failed",
    `${pm} install exited with code ${code ?? "unknown"}`,
    "check the captured output, then run the recovery command shown in the JSON result",
  )

export const internal = (detail: string): CliError =>
  new CliError("internal", `unexpected internal error: ${detail}`, detail)
