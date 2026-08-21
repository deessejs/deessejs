import { Command } from "commander"
import ora from "ora"
import pc from "picocolors"

import {
	fetchUserIdentity,
	openVerificationUrl,
	pollForToken,
	requestDeviceCode,
} from "../../lib/auth/flow/index.js"
import { writeAuth } from "../../lib/auth/store/store.js"
import { type CliError } from "../../errors/index.js"
import { printError, printJson } from "../../output/index.js"

/**
 * deesse auth login (ADR-020).
 *
 * Commander wrapper around the device-flow orchestration in
 * apps/cli/src/lib/auth/flow/. This file owns the command
 * surface: option parsing, spinners, output formatting, and
 * exit-code mapping. The flow itself (request / poll /
 * open-browser) lives in the auth-flow module and is
 * reusable from other commands (e.g. a future `auth
 * reauth`) without duplicating orchestration.
 *
 * Flow summary (full detail in apps/cli/src/lib/auth/flow/):
 *   1. requestDeviceCode: POST /device/code
 *   2. openVerificationUrl: spawn the OS browser
 *   3. pollForToken: poll /device/token until approved
 *   4. fetchUserIdentity: GET /get-session for display
 *   5. writeAuth: persist ~/.deessejs/auth.json with mode 0600
 */
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
				// Rethrow so the index.ts last-resort handler
				// calls process.exit(err.exitCode()). This is
				// also what makes the command testable: vitest
				// catches the throw, asserts on the error shape,
				// and the production path still exits with the
				// right code (via the central handler).
				throw err
			}
			throw e
		}
	})
