import { CliError } from "./index.js"

/**
 * The device code expired before the user approved it
 * (ADR-020 mapping table: Better Auth `expired_token` /
 * `invalid_grant` / `invalid_client` -> cli_device_expired).
 *
 * Also returned for the explicit 30-minute timeout when the
 * poll loop exhausts the device-code TTL without seeing an
 * approval.
 */
export const cliDeviceExpired = (reason?: string): CliError =>
	new CliError(
		"cli_device_expired",
		reason ??
			"the device code expired before it was approved",
		"run `deesse auth login` again to obtain a fresh device code",
	)
