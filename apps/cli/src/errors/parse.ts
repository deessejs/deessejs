import { CliError } from "./index.js"

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
