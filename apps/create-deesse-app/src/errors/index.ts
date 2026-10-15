import { EXIT_ERROR } from "../constants/exit.js"

// Public surface: the closed list of error codes that downstream
// tooling may pattern-match against. Adding a code here is a
// breaking change.
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

export { invalidName } from "./invalid-name.js"
export { destinationExists } from "./destination-exists.js"
export { unsafeArchive } from "./unsafe-archive.js"
export { unsupportedManager } from "./unsupported-manager.js"
export { networkError } from "./network.js"
export { sourceFailed, gitNotInstalled } from "./source-failed.js"
export { internal } from "./internal.js"
export { installFailed } from "./install-failed.js"