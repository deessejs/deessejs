import { Command } from "commander"
import ora from "ora"
import pc from "picocolors"

import { deviceFetch } from "../../auth-store/device-fetch.js"
import { readAuth, type StoredAuth } from "../../auth-store/store.js"
import { internal } from "../../errors/index.js"
import { printJson } from "../../output/index.js"

/**
 * deesse auth status (ADR-020).
 *
 * Read-only command: prints the currently-stored session's
 * identity (email, name, id) and the time the token was
 * fetched. The token is never echoed.
 *
 * If the file does not exist or is malformed, exit with
 * `not_found` (the closed-list code; the user has nothing
 * to query). If the server has invalidated the session
 * since the file was written, surface this as a warning so
 * the user can run `deesse auth login` again.
 *
 * Wire format: the read goes through /api/v1/auth/get-session
 * (the same endpoint the existing /get-session test in
 * packages/api/tests covers) and decodes the published
 * envelope. ADR-001 forbids inventing a custom shape.
 */

type SessionResponse = {
	user: {
		id: string
		email?: string
		name?: string
	}
}

const fetchSession = async (
	accessToken: string,
): Promise<SessionResponse["user"] | null> => {
	const res = await deviceFetch("get-session", {
		method: "GET",
		headers: { authorization: `Bearer ${accessToken}` },
	})
	if (res.status !== 200) return null
	const body = (await res.json()) as { user: SessionResponse["user"] } | null
	return body?.user ?? null
}

const formatStored = (stored: StoredAuth): string => {
	const userBits: string[] = []
	if (stored.user.email) userBits.push(stored.user.email)
	if (stored.user.name) userBits.push(stored.user.name)
	if (stored.user.id) userBits.push(`(${stored.user.id})`)
	const who = userBits.length > 0 ? userBits.join(" ") : "unknown user"
	const when = new Date(stored.fetchedAt).toLocaleString()
	return `${who} — token fetched ${when}`
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
			// Exit 0: this is a read-only status check, not an error.
			// The user has not lost anything; they just have
			// no session yet.
			return
		}

		const spinner = opts.json ? null : ora("Checking session...").start()
		try {
			const user = await fetchSession(stored.access_token)
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
