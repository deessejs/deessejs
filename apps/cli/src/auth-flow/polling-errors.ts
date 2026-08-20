import { cliDeviceExpired, cliDeviceDenied, CliError } from "../errors/index.js"

/**
 * Polling-protocol error mapper (ADR-020).
 *
 * Translates Better Auth device-flow error codes (per the
 * plugin's `error-codes.mjs`) into the CLI's closed list of
 * public error codes (ADR-010 §2). The CLI surfaces the cause
 * instead of masking it with `not_found`.
 *
 * Mapping (per ADR-020):
 *
 *   authorization_pending — not an error; the polling loop
 *     continues and ignores the return value
 *   slow_down — caller is expected to bump the local
 *     interval by 5s and continue (the mapper returns
 *     null to signal 'no error, keep polling')
 *   expired_token — cli_device_expired
 *   access_denied — cli_device_denied
 *   invalid_grant — cli_device_expired (code is invalid or
 *     already used; the user's only recourse is to retry)
 *   invalid_client — cli_device_expired (CLI is not a
 *     registered device client; same recovery: retry)
 *
 * The function returns either `null` (continue polling) or
 * a `CliError` to surface. The caller decides whether the
 * CliError is a hard exit or just a log line; per ADR-010
 * §2 the closed-list codes are user-visible.
 */
export type BetterAuthDeviceErrorCode =
  | "authorization_pending"
  | "slow_down"
  | "expired_token"
  | "access_denied"
  | "invalid_grant"
  | "invalid_client"

export const mapPollingError = (
  code: BetterAuthDeviceErrorCode | string,
): CliError | null => {
  switch (code) {
    case "authorization_pending":
    case "slow_down":
      // Not errors. Caller treats null as "continue polling";
      // for `slow_down`, the caller is also expected to bump
      // its local interval by 5 seconds.
      return null
    case "access_denied":
      return cliDeviceDenied()
    case "expired_token":
    case "invalid_grant":
    case "invalid_client":
      return cliDeviceExpired()
    default:
      // Unknown Better Auth code: treat as expired for the
      // purposes of recovery. The user retries the flow.
      return cliDeviceExpired()
  }
}
