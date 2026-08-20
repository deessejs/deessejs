import { Command } from "commander"
import ora from "ora"
import pc from "picocolors"

import { deviceFetch } from "../../auth-store/device-fetch.js"
import { clearAuth, readAuth } from "../../auth-store/store.js"
import { internal } from "../../errors/index.js"
import { printError, printJson } from "../../output/index.js"

/**
 * deesse auth logout (ADR-020).
 *
 * Sequence:
 *   1. POST /api/v1/auth/sign-out with the stored token to
 *      invalidate the session server-side.
 *   2. Delete ~/.deessejs/auth.json regardless of the
 *      sign-out outcome: a stale file is worse than a
 *      missing one (every subsequent command would silently
 *      use a dead token).
 *
 * Wire format: Better Auth's standard sign-out endpoint. ADR-001
 * forbids inventing a custom wire shape.
 *
 * If the file does not exist, the command exits 0 silently:
 *   there is no session to revoke.
 */

export const logoutCommand = new Command("logout")
	.description("Sign out this machine and remove the stored token")
	.option("--json", "JSON output for scripting")
	.action(async (opts: { json?: boolean }) => {
		const stored = readAuth()
		if (!stored) {
			if (opts.json) {
				printJson({ ok: true, reason: "no_session" })
			}
			// No local file => nothing to revoke server-side
			// either. Silent success, exit 0.
			return
		}

		const spinner = opts.json
			? null
			: ora("Signing out...").start()
		try {
			const res = await deviceFetch("sign-out", {
				method: "POST",
				headers: {
					authorization: `Bearer ${stored.access_token}`,
					"content-type": "application/json",
				},
			})
			// We deliberately do NOT throw on a non-2xx here:
			// the local cache cleanup is the user-facing
			// outcome. A server-side failure (e.g. token
			// already revoked) is logged but the local file
			// is cleared regardless. The user's machine is
			// now in a "no session" state either way.
			if (res.status !== 200 && res.status !== 204) {
				spinner?.stop()
				if (!opts.json) {
					console.log(
						pc.yellow(
							`Server returned HTTP ${res.status} on sign-out; clearing the local token file anyway.`,
						),
					)
				}
			} else {
				spinner?.stop()
			}
			clearAuth()
			if (opts.json) {
				printJson({ ok: true })
			} else {
				console.log(pc.green("✓ signed out"))
			}
		} catch (e) {
			spinner?.stop()
			clearAuth()
			throw internal(e instanceof Error ? e.message : String(e))
		}
	})
