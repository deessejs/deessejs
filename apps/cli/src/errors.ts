import { EXIT_ERROR } from "./constants.js"

export type CliErrorCode =
  | "not_found"
  | "network_error"
  | "git_not_installed"
  | "target_exists"
  | "install_failed"
  | "parse_error"
  | "internal"

export class CliError extends Error {
  public readonly code: CliErrorCode
  public readonly hint: string | undefined

  constructor(code: CliErrorCode, message: string, hint?: string) {
    super(message)
    this.name = "CliError"
    this.code = code
    this.hint = hint
  }

  public exitCode = (): number => EXIT_ERROR
}

export const notFound = (slug: string, available: string[]): CliError =>
  new CliError(
    "not_found",
    `template "${slug}" not found`,
    `available templates: ${available.join(", ")}`,
  )

export const networkError = (detail: string): CliError =>
  new CliError(
    "network_error",
    `could not reach the templates endpoint`,
    detail,
  )

export const gitNotInstalled = (): CliError =>
  new CliError(
    "git_not_installed",
    "`git` is not installed or not on PATH",
    "install git from https://git-scm.com and try again",
  )

export const targetExists = (dir: string): CliError =>
  new CliError(
    "target_exists",
    `target directory "${dir}" already exists`,
    "remove the directory or pass --force to overwrite",
  )

export const installFailed = (
  pm: string,
  code: number | null,
): CliError =>
  new CliError(
    "install_failed",
    `${pm} install exited with code ${code ?? "unknown"}`,
    "check the output above, then run the install command manually inside the cloned directory",
  )

/**
 * Build a parse_error. The default message describes a generic
 * response-shape mismatch; callers that know what went wrong (e.g.
 * server returned an ORPCError with code RATE_LIMITED) pass a
 * custom message that the user will see directly.
 */
export const parseError = (
  detail: string,
  message: string = "templates endpoint returned malformed data",
): CliError => new CliError("parse_error", message, detail)

export const internal = (detail: string): CliError =>
  new CliError("internal", "unexpected internal error", detail)