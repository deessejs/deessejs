import { EXIT_ERROR } from "../constants/exit.js"

// Public surface (per ADR-010 §2): the closed list of error codes
// that downstream tooling may pattern-match against. Adding a code
// here is a breaking change.
//
// The two device-flow codes (cli_device_denied,
// cli_device_expired) are an amendment to the closed list, added
// in lockstep with ADR-020 (device authorization). They are not
// a precedent for further openings; see ADR-010 §2 "What this
// rule forbids".
export type CliErrorCode =
  | "not_found"
  | "network_error"
  | "parse_error"
  | "cli_outdated"
  | "cli_device_denied"
  | "cli_device_expired"

// Internal codes, used only inside the CLI. Not surfaced as a public
// pattern-match surface. Adding a code here is non-breaking.
export type InternalCliErrorCode =
  | "git_not_installed"
  | "target_exists"
  | "install_failed"
  | "internal"

export type AnyCliErrorCode = CliErrorCode | InternalCliErrorCode

export class CliError extends Error {
  public readonly code: AnyCliErrorCode
  public readonly hint: string | undefined

  constructor(code: AnyCliErrorCode, message: string, hint?: string) {
    super(message)
    this.name = "CliError"
    this.code = code
    this.hint = hint
  }

  public exitCode = (): number => EXIT_ERROR
}

// Public factories (re-export the per-code files).
export { networkError } from "./network.js"
export { parseError } from "./parse.js"
export { notFound } from "./not-found.js"
export { cliOutdated } from "./outdated.js"
export { cliDeviceDenied } from "./device-denied.js"
export { cliDeviceExpired } from "./device-expired.js"

// Internal factories, kept in this file because they are not part of
// the public surface (ADR-010 §2 "What this rule allows": internal
// error codes are not surfaced to the user).
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

export const internal = (detail: string): CliError =>
  new CliError("internal", "unexpected internal error", detail)
