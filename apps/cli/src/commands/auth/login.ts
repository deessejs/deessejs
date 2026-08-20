import { Command } from "commander"
import open from "open"
import ora from "ora"
import pc from "picocolors"

import { deviceFetch } from "../../auth-store/device-fetch.js"
import { writeAuth } from "../../auth-store/store.js"
import { cliDeviceExpired, internal, type CliError } from "../../errors/index.js"
import { printError, printJson } from "../../output/index.js"
import { sleep } from "../../utils/sleep.js"

import { mapPollingError, type BetterAuthDeviceErrorCode } from "./polling-errors.js"

/**
 * deesse auth login (ADR-020).
 *
 * Flow:
 *   1. POST /api/v1/auth/device/code with { client_id }.
 *   2. Open the browser to verification_uri_complete so the
 *      user lands on /device?user_code=... with the code in
 *      the query string (per ADR-020 "verification_uri_complete"
 *      rule, not verification_uri alone).
 *   3. Poll /device/token every `interval` seconds (default 5),
 *      mapping Better Auth codes via mapPollingError:
 *        authorization_pending -> keep polling
 *        slow_down -> bump local +5s, keep polling
 *        expired_token / access_denied / invalid_grant /
 *          invalid_client -> cliDeviceExpired / cliDeviceDenied
 *   4. After the polling returns the Better Auth session token,
 *      /get-session is called to attach the user identity to
 *      the stored auth, then writeAuth persists to disk.
 *
 * The 30-minute total timeout is enforced by an absolute
 * deadline (T0 = code issuance) checked inside the loop.
 * Per ADR-020, the timeout reuses the same sleep helper as
 * the polling interval (no second timing mechanism).
 *
 * The wire format is whatever Better Auth publishes (ADR-001);
 * this command does not parse envelopes that are not
 * documented in the plugin's routes.mjs.
 */

const POLL_INTERVAL_MS = 5_000
const POLL_INTERVAL_WITH_BACKOFF_MS = 10_000
const TOTAL_TIMEOUT_MS = 30 * 60 * 1_000 // 30 minutes per device-code TTL

type DeviceCodeResponse = {
	device_code: string
	user_code: string
	verification_uri: string
	verification_uri_complete: string
	expires_in: number
	interval: number
}

type DeviceTokenSuccess = {
	access_token: string
	userId: string | null
	scope?: string | null
}

type DeviceTokenFailure = {
	error: BetterAuthDeviceErrorCode
	error_description?: string
}

type DeviceSessionResponse = {
	user: {
		id: string
		email?: string
		name?: string
	}
}

type IssuedDeviceCode = {
	body: DeviceCodeResponse
	expiresBy: number
}

const requestDeviceCode = async (): Promise<IssuedDeviceCode> => {
	const res = await deviceFetch("device/code", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ client_id: "deessejs-cli" }),
	})
	if (res.status !== 200) {
		const text = await res.text()
		throw cliDeviceExpired(
			`could not obtain a device code (HTTP ${res.status}): ${text || "no body"}`,
		)
	}
	const body = (await res.json()) as DeviceCodeResponse
	return {
		body,
		expiresBy: Date.now() + TOTAL_TIMEOUT_MS,
	}
}

const openVerificationUrl = async (url: string): Promise<void> => {
	// `open` returns a child process handle; we don't await it
	// because the user-facing flow is async (the browser opens,
	// the user approves, the poll loop resolves).
	await open(url, { wait: false })
}

const pollForToken = async (
	deviceCode: string,
	expiresBy: number,
): Promise<DeviceTokenSuccess> => {
	let interval = POLL_INTERVAL_MS
	let lastError: CliError | null = null
	for (;;) {
		if (Date.now() >= expiresBy) {
			throw cliDeviceExpired("device flow timed out after 30 minutes")
		}
		await sleep(interval)
		const res = await deviceFetch("device/token", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				grant_type: "urn:ietf:params:oauth:grant-type:device_code",
				device_code: deviceCode,
				client_id: "deessejs-cli",
			}),
		})
		if (res.status === 200) {
			const body = (await res.json()) as DeviceTokenSuccess
			return body
		}
		const failure = (await res.json()) as DeviceTokenFailure
		const mapped = mapPollingError(failure.error)
		if (mapped !== null) {
			// A real error (expired / denied / invalid). Surface
			// it. The CLI exits through CliError with the
			// appropriate user-facing copy.
			throw mapped
		}
		// slow_down: bump the local interval for the next poll.
		interval = POLL_INTERVAL_WITH_BACKOFF_MS
		// Track the last error for any debug logging; the loop
		// itself does not surface slow_down / pending states
		// (per ADR-020, they are silent).
		lastError = lastError
	}
}

const fetchUserIdentity = async (
	accessToken: string,
): Promise<DeviceSessionResponse["user"] | null> => {
	const res = await deviceFetch("get-session", {
		method: "GET",
		headers: { authorization: `Bearer ${accessToken}` },
	})
	if (res.status !== 200) return null
	const body = (await res.json()) as { user: DeviceSessionResponse["user"] } | null
	return body?.user ?? null
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

			const url = issued.body.verification_uri_complete
			if (!opts.json) {
				console.log()
				console.log(
					pc.cyan(
						`Open the following URL in your browser if it doesn't open automatically:`,
					),
				)
				console.log(pc.bold(url))
				console.log()
			}

			await openVerificationUrl(url)

			const pollSpinner = opts.json
				? null
				: ora("Waiting for browser approval...").start()
			try {
				const token = await pollForToken(
					issued.body.device_code,
					issued.expiresBy,
				)
				const user = await fetchUserIdentity(token.access_token)
				writeAuth({
					access_token: token.access_token,
					user: user ?? { id: token.userId ?? "" },
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
