import { Command } from "commander"
import open from "open"
import ora from "ora"
import pc from "picocolors"

import { authClient } from "../../auth-store/better-auth-client.js"
import { writeAuth } from "../../auth-store/store.js"
import { cliDeviceExpired, internal, type CliError } from "../../errors/index.js"
import { printError, printJson } from "../../output/index.js"
import { sleep } from "../../utils/sleep.js"

import { mapPollingError } from "./polling-errors.js"

/**
 * deesse auth login (ADR-020).
 *
 * Flow:
 *   1. authClient.device.code({ client_id }) -> issued code
 *      + verification_uri_complete. The response is typed by
 *      the deviceAuthorizationClient plugin (Better Auth
 *      publishes the schema; the client infers it).
 *   2. Open the browser to verification_uri_complete so the
 *      user lands on /device?user_code=... with the code in
 *      the query string (per ADR-020, not verification_uri
 *      alone).
 *   3. Poll authClient.device.token(...) every 5 seconds with
 *      slow_down bumping the local interval by 5 seconds.
 *      mapPollingError translates Better Auth's error codes
 *      to the CLI's closed CliErrorCode list.
 *   4. After the token resolves, authClient.getSession() is
 *      called to attach the user identity to the stored
 *      auth, then writeAuth persists to disk.
 *
 * The 30-minute total timeout is enforced by an absolute
 * deadline (T0 = code issuance) checked inside the loop.
 * Per ADR-020, the timeout reuses the same sleep helper as
 * the polling interval (no second timing mechanism).
 */

const POLL_INTERVAL_MS = 5_000
const POLL_INTERVAL_WITH_BACKOFF_MS = 10_000
const TOTAL_TIMEOUT_MS = 30 * 60 * 1_000 // 30 minutes per device-code TTL

const openVerificationUrl = async (url: string): Promise<void> => {
	// `open` returns a child process handle; we don't await it
	// because the user-facing flow is async (the browser opens,
	// the user approves, the poll loop resolves).
	await open(url, { wait: false })
}

const requestDeviceCode = async (): Promise<{
	url: string
	deviceCode: string
	expiresBy: number
}> => {
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

const pollForToken = async (
	deviceCode: string,
	expiresBy: number,
): Promise<{ accessToken: string }> => {
	let interval = POLL_INTERVAL_MS
	for (;;) {
		if (Date.now() >= expiresBy) {
			throw cliDeviceExpired("device flow timed out after 30 minutes")
		}
		await sleep(interval)
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
		const code = (error as { code?: string } | null)?.code
		if (!code) {
			// No data and no recognized error code: treat as
			// an internal error, do not loop forever.
			throw cliDeviceExpired("token endpoint returned no data and no error code")
		}
		const mapped = mapPollingError(code)
		if (mapped !== null) {
			throw mapped
		}
		// slow_down: bump the local interval for the next poll.
		// Per ADR-020, slow_down and pending are silent (no log
		// line, no toast); the caller keeps polling.
		interval = POLL_INTERVAL_WITH_BACKOFF_MS
	}
}

const fetchUserIdentity = async (): Promise<{
	id: string
	email?: string
	name?: string
} | null> => {
	const { data } = await authClient.getSession()
	if (!data) return null
	return data.user as { id: string; email?: string; name?: string }
}

export const loginCommand = new Command("login")
	.description("Authorize this machine against the DeesseJS server")
	.option("--json", "JSON output for scripting")
	.action(async (opts: { json?: boolean }) => {
		const spinner = opts.json
			? null
			: ora("Requesting device code...").start()
		try {
			const issued = await requestDeviceCode()
			spinner?.stop()

			if (!opts.json) {
				console.log()
				console.log(
					pc.cyan(
						`Open the following URL in your browser if it doesn't open automatically:`,
					),
				)
				console.log(pc.bold(issued.url))
				console.log()
			}

			await openVerificationUrl(issued.url)

			const pollSpinner = opts.json
				? null
				: ora("Waiting for browser approval...").start()
			try {
				const token = await pollForToken(issued.deviceCode, issued.expiresBy)
				const user = await fetchUserIdentity()
				writeAuth({
					access_token: token.accessToken,
					user: user ?? { id: "" },
					fetchedAt: new Date().toISOString(),
				})
				pollSpinner?.stop()
				if (opts.json) {
					printJson({ ok: true, user: user ?? null })
				} else {
					console.log()
					console.log(
						pc.green("✓ logged in as ") +
							pc.bold(user?.email ?? user?.name ?? user?.id ?? "unknown user"),
					)
				}
			} finally {
				pollSpinner?.stop()
			}
		} catch (e) {
			spinner?.stop()
			if (e instanceof Error && "code" in e && "exitCode" in e) {
				const err = e as CliError
				if (opts.json) {
					printJson({ ok: false, code: err.code, message: err.message })
				} else {
					printError(err)
				}
				process.exit(err.exitCode())
			}
			throw internal(e instanceof Error ? e.message : String(e))
		}
	})
