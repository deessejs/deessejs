import { EXIT_ERROR } from "../constants/exit.js"

// Public surface: the closed list of error codes that downstream
// tooling may pattern-match against. Adding a code here is a
// breaking change.
//
// The two device-flow codes (cli_device_denied,
// cli_device_expired) are an amendment to the closed list, added
// in lockstep with the device-authorization plugin. They are not
// a precedent for further openings; the closed list stays closed.
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
  | "target_exists"
  | "target_not_empty"
  | "invalid_target"
  | "template_invalid"
  | "materialize_failed"
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
// the public surface: internal error codes are not surfaced to the
// user.
export const targetExists = (dir: string): CliError =>
  new CliError(
    "target_exists",
    `target directory "${dir}" already exists`,
    "choose an unused directory, or pass --force if the target already exists and is empty"
  )

export const targetNotEmpty = (dir: string): CliError =>
  new CliError(
    "target_not_empty",
    `target directory "${dir}" is not empty`,
    "choose an empty directory; --force only allows an existing empty directory"
  )

export const invalidTarget = (dir: string, detail: string): CliError =>
  new CliError(
    "invalid_target",
    `target path "${dir}" cannot be used safely`,
    detail
  )

export const templateInvalid = (repository: string, detail: string): CliError =>
  new CliError(
    "template_invalid",
    `template source "${repository}" cannot be installed`,
    detail
  )

export const materializeFailed = (dir: string, detail: string): CliError =>
  new CliError(
    "materialize_failed",
    `failed to create the project in "${dir}"`,
    detail
  )

export const installFailed = (pm: string, code: number | null): CliError =>
  new CliError(
    "install_failed",
    `${pm} install exited with code ${code ?? "unknown"}`,
    "check the output above, then run the install command manually inside the created directory"
  )

export const internal = (detail: string): CliError =>
  new CliError("internal", "unexpected internal error", detail)
