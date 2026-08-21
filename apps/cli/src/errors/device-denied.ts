import { CliError } from "./index.js"

/**
 * The user denied the device-flow authorization in the
 * browser (ADR-020 mapping table: Better Auth
 * `access_denied` -> cli_device_denied).
 */
export const cliDeviceDenied = (): CliError =>
	new CliError(
		"cli_device_denied",
		"authorization was denied in the browser",
		"run `deesse auth login` again if this was a mistake",
	)
