import { Command } from "commander"
import ora from "ora"
import pc from "picocolors"

import { bearerFetch } from "../../lib/auth/store/bearer-fetch.js"
import { readAuth, type StoredAuth } from "../../lib/auth/store/store.js"
import { internal } from "../../errors/index.js"
import { printJson } from "../../output/index.js"

/**
 * deesse auth status (ADR-020).
 *
 * Read-only command. Validates the stored session token
 * against the server's /get-session endpoint. The typed
 * better-auth client cannot drive this case (it sends the
 * session cookie, not a caller-supplied bearer token),
 * so this command uses the bearer-fetch helper directly.
 *
 * Terminal states:
 *  - No auth.json: yellow notice, exit 0. No session is the
 *    normal pre-login state.
 *  - Token still valid server-side: green ✓, identity
 *    echoed back, fetchedAt shown.
 *  - Token revoked or expired server-side: yellow notice,
 *    stale identity shown for context, exit 0. The user
 *    reruns auth login.
 *
 * The token itself is never echoed.
 */

type StoredUser = StoredAuth["user"]

const formatStored = (stored: StoredAuth): string => {
	const userBits: string[] = []
	if (stored.user.email) userBits.push(stored.user.email)
	if (stored.user.name) userBits.push(stored.user.name)
	if (stored.user.id) userBits.push(`(${stored.user.id})`)
	const who = userBits.length > 0 ? userBits.join(" ") : "unknown user"
	const when = new Date(stored.fetchedAt).toLocaleString()
	return `${who} — token fetched ${when}`
}

const validateSession = async (
	accessToken: string,
): Promise<StoredUser | null> => {
	const res = await bearerFetch("get-session", accessToken, { method: "GET" })
	if (res.status !== 200) return null
	const body = (await res.json()) as { user?: StoredUser } | null
	return body?.user ?? null
}

export const statusCommand = new Command("status")
	.description("Show the current CLI auth session")
	.option("--json", "JSON output for scripting")
	.action(async (opts: { json?: boolean }) => {
		const stored = readAuth()
		if (!stored) {
			if (opts.json) {
				printJson({ ok: false, reason: "no_session" })
			} else {
				console.error(
					pc.yellow(
						"no active session. Run `deesse auth login` to authorise this machine.",
					),
				)
			}
			return
		}

		const spinner = opts.json ? null : ora("Checking session...").start()
		try {
			const user = await validateSession(stored.access_token)
			if (!user) {
				spinner?.stop()
				if (opts.json) {
					printJson({
						ok: false,
						reason: "session_invalid",
						stored: {
							user: stored.user,
							fetchedAt: stored.fetchedAt,
						},
					})
				} else {
					console.log()
					console.log(
						pc.yellow(
							"The stored token no longer matches an active session on the server. Run `deesse auth login` again.",
						),
					)
					console.log(pc.dim(formatStored(stored)))
				}
				return
			}
			spinner?.stop()
			if (opts.json) {
				printJson({ ok: true, user, fetchedAt: stored.fetchedAt })
			} else {
				console.log()
				console.log(pc.green("✓ active session"))
				console.log(pc.dim(formatStored({ ...stored, user })))
			}
		} catch (e) {
			spinner?.stop()
			throw internal(e instanceof Error ? e.message : String(e))
		}
	})
