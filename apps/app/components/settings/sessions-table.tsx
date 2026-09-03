"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { asCurrentSessionToken, asSessionToken } from "@workspace/auth/types"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@workspace/ui/components/dialog"

interface Session {
	id: string
	token: string
	userAgent: string
	ipAddress: string
	expiresAt: Date
	isCurrent: boolean
}

export function SessionsTable() {
	const [sessions, setSessions] = useState<Session[]>([])
	const [loading, setLoading] = useState(true)
	const [revoking, setRevoking] = useState<string | null>(null)
	const [revokeAllOpen, setRevokeAllOpen] = useState(false)
	const [revokingAll, setRevokingAll] = useState(false)

	// Audit §3.5: useCallback's body calls `authClient.getSession()` (the
	// async getter, not a hook). The previous `authClient.useSession()` was
	// a Rules of Hooks violation — it called useStore from inside an async
	// callback, outside React's render lifecycle, returning a stale value
	// (typically the value from a previous render). For the same reason
	// `revokeOtherSessions` was operating on a stale "current" token,
	// risking self-logout.
	const loadSessions = useCallback(async () => {
		setLoading(true)
		const [{ data: sessionList }, { data: currentSession }] = await Promise.all([
			authClient.listSessions(),
			authClient.getSession(),
		])
		setLoading(false)

		if (!sessionList || !currentSession) {
			setSessions([])
			return
		}

		// Audit §3.4: currentSession.session.token is the cookie value. Cast
		// to branded type at the trust boundary; revoking "this device" by
		// its id would be a no-op since `revokeSession` looks up by token.
		const currentToken = asCurrentSessionToken(currentSession.session?.token ?? "")

		setSessions(
			sessionList.map((s: { id: string; token: string; [k: string]: unknown }) => ({
				id: s.id,
				token: s.token,
				userAgent: s.userAgent ?? "Unknown",
				ipAddress: s.ipAddress ?? "—",
				expiresAt: s.expiresAt,
				isCurrent: s.token === currentToken,
			})),
		)
	}, [])

	useEffect(() => {
		// Valid: loading data on mount requires setState
		// eslint-disable-next-line react-hooks/set-state-in-effect
		loadSessions()
	}, [loadSessions])

	// Audit §3.4: was passing `id` (row id) as `token` (cookie value). The
	// server lookup `WHERE token = ?` found nothing, the call returned
	// success-on-no-op, the local state mutated to remove the row, and the
	// user thought their "lost device" session was revoked. Now the token
	// is branded at the boundary so a future id/token swap is a TS error.
	async function handleRevoke(token: string) {
		setRevoking(token)
		const { error } = await authClient.revokeSession({ token: asSessionToken(token) })

		// Audit §3.5 sibling: do not mutate local state when the call
		// failed. The previous code filtered the row out regardless of
		// `error`, so failed revokes looked successful in the UI while
		// the underlying session stayed alive.
		if (error) {
			toast.error(error.message ?? "Failed to revoke session")
		} else {
			setSessions((prev) => prev.filter((s) => s.token !== token))
		}
		setRevoking(null)
	}

	async function handleRevokeAll() {
		setRevokingAll(true)
		const { error } = await authClient.revokeOtherSessions()
		setRevokingAll(false)
		setRevokeAllOpen(false)

		if (error) {
			toast.error(error.message ?? "Failed to sign out other sessions")
		} else {
			// `isCurrent` is computed at list-load time from currentToken.
			// After `revokeOtherSessions`, the server has deleted all
			// sessions except the current one. We re-fetch to refresh the
			// list rather than trust the locally-stale `isCurrent` flag.
			await loadSessions()
		}
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				<Dialog open={revokeAllOpen} onOpenChange={setRevokeAllOpen}>
					<DialogTrigger asChild>
						<Button variant="outline" size="sm">
							Sign out everywhere else
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Sign out of other sessions?</DialogTitle>
							<DialogDescription>
								You will be signed out of all other devices and browsers.
								Only your current session will remain active.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button variant="outline" onClick={() => setRevokeAllOpen(false)}>
								Cancel
							</Button>
							<Button variant="destructive" onClick={handleRevokeAll} disabled={revokingAll}>
								{revokingAll ? "Signing out…" : "Sign out everywhere"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<div className="flex flex-col gap-2">
				{loading && sessions.length === 0 && (
					<p className="text-sm text-muted-foreground">Loading sessions…</p>
				)}
				{!loading && sessions.length === 0 && (
					<p className="text-sm text-muted-foreground">No other active sessions.</p>
				)}
				{sessions.map((session) => (
					<div
						key={session.id}
						className="flex items-center justify-between rounded-lg border p-3"
					>
						<div className="flex flex-col gap-0.5">
							<div className="flex items-center gap-2">
								<p className="text-sm font-medium">{session.userAgent}</p>
								{session.isCurrent && (
									<span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
										Current
									</span>
								)}
							</div>
							<p className="text-xs text-muted-foreground">
								{session.ipAddress} · Expires {new Date(session.expiresAt).toLocaleDateString()}
							</p>
						</div>
						{!session.isCurrent && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handleRevoke(session.token)}
								disabled={revoking === session.token}
							>
								{revoking === session.token ? "Signing out…" : "Sign out"}
							</Button>
						)}
					</div>
				))}
			</div>
		</div>
	)
}