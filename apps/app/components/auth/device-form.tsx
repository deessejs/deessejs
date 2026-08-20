"use client"

import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { ShieldCheckIcon, ShieldXIcon } from "lucide-react"

/**
 * Device-flow state machine (ADR-020).
 *
 * Owns the four states defined in the ADR:
 *   - not signed in: user lands here without a session
 *   - claimed, pending: the user has signed in and the claim
 *     is bound to their session; status is "pending"
 *   - approved: the user clicked approve, status is "approved";
 *     the CLI will pick up the access token on its next poll
 *   - denied, expired, or invalid: the device-code record's
 *     status is "denied" or "expired" or the record is missing;
 *     the user sees the "Expired" panel
 *
 * The read path (`authClient.device(...)`) goes through
 * `useQuery` with a stable `queryKey` keyed on the validated
 * `user_code`. The two mutations (`approve`, `deny`) go
 * through `useMutation` so the in-flight state can disable
 * the buttons without a local boolean. The component does not
 * hold raw `useState` / `useEffect` for the state machine —
 * every async state lives in the React Query cache.
 *
 * TanStack Query is wired at the root layout (see
 * `apps/app/app/layout.tsx`); this component assumes the
 * provider is in scope.
 */
export function DeviceForm({ userCode }: { userCode: string | null }) {
	const queryClient = useQueryClient()

	const claim = useQuery({
		// The query key is the user_code so a re-mount or a
		// re-query hits the same cache entry. When the user is
		// not signed in, useQuery still runs (it is not gated on
		// session); the response just has status: "pending"
		// until a session binds.
		queryKey: ["device", "claim", userCode],
		queryFn: async () => {
			if (!userCode) throw new Error("missing user_code")
			const res = await authClient.device({
				query: { user_code: userCode },
			})
			if (res.error) throw new Error(res.error.error_description ?? "device claim failed")
			// The plugin's envelope is { user_code, status }; the
			// exact additional fields depend on Better Auth version.
			return res.data as { user_code: string; status: "pending" | "approved" | "denied" }
		},
		// No polling on the read path. The user lands here
		// once and decides. The CLI is the one that polls
		// /device/token; the page reads /device on user action.
		enabled: userCode !== null,
		retry: false,
	})

	const approve = useMutation({
		mutationFn: async () => {
			if (!userCode) throw new Error("missing user_code")
			const res = await authClient.device.approve({
				userCode,
			})
			if (res.error) throw new Error(res.error.error_description ?? "approve failed")
			return res.data
		},
		onSuccess: () => {
			toast.success("Device approved. You can close this tab and return to your terminal.")
			void queryClient.invalidateQueries({
				queryKey: ["device", "claim", userCode],
			})
		},
		onError: (err: Error) => {
			toast.error(err.message)
		},
	})

	const deny = useMutation({
		mutationFn: async () => {
			if (!userCode) throw new Error("missing user_code")
			const res = await authClient.device.deny({
				userCode,
			})
			if (res.error) throw new Error(res.error.error_description ?? "deny failed")
			return res.data
		},
		onSuccess: () => {
			toast.success("Device request denied.")
			void queryClient.invalidateQueries({
				queryKey: ["device", "claim", userCode],
			})
		},
		onError: (err: Error) => {
			toast.error(err.message)
		},
	})

	// State 4: invalid or missing user_code — render the same
	// "Expired" panel as a real expiry. Hiding the bad-URL
	// reason avoids telling an unauthenticated visitor why the
	// URL was malformed.
	if (!userCode) {
		return <ExpiredPanel />
	}

	const status = claim.data?.status

	// State 3: approved.
	if (status === "approved") {
		return <ApprovedPanel />
	}

	// State 2: claimed, pending — the session is bound, status
	// is pending. Show the approve/deny buttons.
	if (status === "pending") {
		return (
			<div className="flex flex-col gap-6">
				<div className="flex flex-col items-center gap-3 rounded-lg border p-6">
					<div className="flex size-12 items-center justify-center rounded-full border bg-muted">
						<ShieldCheckIcon className="size-5 text-muted-foreground" />
					</div>
					<p className="text-center text-sm text-muted-foreground">
						A device is requesting access to your DeesseJS account.
						Approve to let the CLI act on your behalf, or deny to cancel.
					</p>
				</div>
				<div className="flex flex-col gap-2">
					<Button
						type="button"
						disabled={approve.isPending || deny.isPending}
						onClick={() => approve.mutate()}
					>
						{approve.isPending ? "Approving…" : "Approve device"}
					</Button>
					<Button
						type="button"
						variant="outline"
						disabled={approve.isPending || deny.isPending}
						onClick={() => deny.mutate()}
					>
						{deny.isPending ? "Denying…" : "Deny"}
					</Button>
				</div>
			</div>
		)
	}

	// State 4: denied, expired, or invalid record.
	if (status === "denied") {
		return <ExpiredPanel reason="denied" />
	}

	// Loading or unknown status: render the pending shell so the
	// user sees the same approval UI on first paint once the
	// claim resolves. If the read fails (status: denied /
	// expired / record missing) we fall through to Expired.
	if (claim.isError) {
		return <ExpiredPanel />
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col items-center gap-3 rounded-lg border p-6">
				<div className="flex size-12 items-center justify-center rounded-full border bg-muted">
					<ShieldCheckIcon className="size-5 text-muted-foreground" />
				</div>
				<p className="text-center text-sm text-muted-foreground">
					Loading device request…
				</p>
			</div>
		</div>
	)
}

function ExpiredPanel({ reason }: { reason?: "denied" } = {}) {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col items-center gap-3 rounded-lg border p-6">
				<div className="flex size-12 items-center justify-center rounded-full border bg-muted">
					<ShieldXIcon className="size-5 text-muted-foreground" />
				</div>
				<p className="text-center text-sm text-muted-foreground">
					{reason === "denied"
						? "This device request was denied."
						: "This code has expired or is invalid. Run `deesse auth login` again."}
				</p>
			</div>
			<Separator />
			<p className="text-center text-sm text-muted-foreground">
				<Link href="/home" className="text-primary underline-offset-4 hover:underline">
					Back to home
				</Link>
			</p>
		</div>
	)
}

function ApprovedPanel() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col items-center gap-3 rounded-lg border p-6">
				<div className="flex size-12 items-center justify-center rounded-full border bg-muted">
					<ShieldCheckIcon className="size-5 text-primary" />
				</div>
				<p className="text-center text-sm text-muted-foreground">
					You can close this tab and return to your terminal.
				</p>
			</div>
			<p className="text-center text-sm text-muted-foreground">
				<Link href="/home" className="text-primary underline-offset-4 hover:underline">
					Back to home
				</Link>
			</p>
		</div>
	)
}
