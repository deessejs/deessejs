import { cliDeviceExpired } from "../../../errors/index.js"
import { sleep } from "../../../utils/sleep.js"

import { bearerFetch } from "../store/bearer-fetch.js"
import { createCliAuthClient } from "../store/better-auth-client.js"

import { mapPollingError } from "./polling-errors.js"

/**
 * Device-flow orchestration (ADR-020, ADR-022).
 *
 * Three pure functions that the `login` command composes:
 *
 *  - requestDeviceCode: hits /device/code, returns the
 *    issued code + the URL to open + an absolute deadline
 *    matching the device-code TTL (30 minutes, per
 *    Better Auth's plugin default).
 *
 *  - pollForToken: hits /device/token until the Better
 *    Auth error codes say "approved" (returns the token)
 *    or one of the closed-list terminal codes says "no".
 *    Honors slow_down by bumping the local interval by 5
 *    seconds. Per ADR-020, silent on authorization_pending
 *    and slow_down; surfaces cli_device_expired /
 *    cli_device_denied per the polling-errors mapper.
 *
 *  - fetchUserIdentity (ADR-022): resolves the user tied
 *    to the device-flow access token by calling
 *    /get-session with `Authorization: Bearer <token>`.
 *    Uses `bearerFetch` (raw fetch) instead of the typed
 *    Better Auth client because the typed client is
 *    cookie-based and the CLI has no cookie jar. Throws
 *    `cliDeviceExpired` (not a soft null) when the server
 *    rejects the token or returns no user — a token
 *    without a resolvable identity is a server-side or
 *    wire-protocol regression, not a normal state. See
 *    ADR-022 §"Decision / 1. CLI side".
 *
 * Polling interval constants live here, not in login.ts,
 * because they are part of the device-flow protocol, not
 * the commander wrapper around it.
 */

const POLL_INTERVAL_MS = 5_000
const POLL_INTERVAL_WITH_BACKOFF_MS = 10_000
const TOTAL_TIMEOUT_MS = 30 * 60 * 1_000 // 30 minutes per device-code TTL

export type IssuedDeviceCode = {
	url: string
	deviceCode: string
	expiresBy: number
}

export type ResolvedToken = {
	accessToken: string
}

export type UserIdentity = {
	id: string
	email?: string
	name?: string
}

export const requestDeviceCode = async (): Promise<IssuedDeviceCode> => {
	const authClient = createCliAuthClient()
	const { data, error } = await authClient.device.code({
		client_id: "deessejs-cli",
	})
	if (error || !data) {
		const description =
			(error as { error_description?: string } | null)?.error_description ??
			"unknown error"
		throw cliDeviceExpired(`could not obtain a device code: ${description}`)
	}
	return {
		url: data.verification_uri_complete,
		deviceCode: data.device_code,
		expiresBy: Date.now() + TOTAL_TIMEOUT_MS,
	}
}

export const pollForToken = async (
	deviceCode: string,
	expiresBy: number,
): Promise<ResolvedToken> => {
	let interval = POLL_INTERVAL_MS
	for (;;) {
		if (Date.now() >= expiresBy) {
			throw cliDeviceExpired("device flow timed out after 30 minutes")
		}
		await sleep(interval)
		const authClient = createCliAuthClient()
		const { data, error } = await authClient.device.token({
			grant_type: "urn:ietf:params:oauth:grant-type:device_code",
			device_code: deviceCode,
			client_id: "deessejs-cli",
		})
		if (data) {
			// The plugin types `data` as `unknown` in some
			// Better Auth 1.6.x minor versions; the access
			// token field is stable across versions.
			const token = (data as { access_token: string }).access_token
			return { accessToken: token }
		}
		// The plugin's error envelope is
		//   { error: "access_denied", error_description: "..." }
		// (per better-auth/dist/plugins/device-authorization/
		// routes.mjs deviceTokenErrorSchema). The field name is
		// `error`, not `code`. Reading `code` here silently
		// yields undefined and the polling loop falls through
		// to the "no error code" guard below, which throws
		// cliDeviceExpired instead of the actual reason.
		const code = (error as { error?: string } | null)?.error
		if (!code) {
			throw cliDeviceExpired(
				"token endpoint returned no data and no error code",
			)
		}
		const mapped = mapPollingError(code)
		if (mapped !== null) {
			throw mapped
		}
		// slow_down: bump the local interval for the next poll.
		// Per ADR-020, slow_down and pending are silent.
		interval = POLL_INTERVAL_WITH_BACKOFF_MS
	}
}

export const fetchUserIdentity = async (
	accessToken: string,
): Promise<UserIdentity> => {
	const response = await bearerFetch("get-session", accessToken, { method: "GET" })
	if (!response.ok) {
		throw cliDeviceExpired(
			`server issued a session token but /get-session rejected it (HTTP ${response.status})`,
		)
	}
	const body = (await response.json()) as { user?: UserIdentity }
	if (!body.user) {
		throw cliDeviceExpired(
			"server issued a session token but no user identity was attached",
		)
	}
	return body.user
}
