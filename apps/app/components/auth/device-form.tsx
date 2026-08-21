"use client"

import Link from "next/link"
import { toast } from "sonner"
import { useDeviceClaim } from "@/hooks/use-device-flow"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { ShieldCheckIcon, ShieldXIcon } from "lucide-react"

/**
 * Device-flow presentation component (ADR-020).
 *
 * The four states defined in the ADR are rendered here:
 *   - not signed in / invalid user_code → ExpiredPanel
 *   - approved → ApprovedPanel
 *   - claimed, pending → approve / deny buttons
 *   - denied → ExpiredPanel with reason="denied"
 *
 * All async state (the read of authClient.device, the approve
 * mutation, the deny mutation) lives in `useDeviceClaim` in
 * `@/hooks/use-device-flow`. The form is a pure renderer; no
 * `useState` / `useEffect` for the state machine.
 */
export function DeviceForm({ userCode }: { userCode: string | null }) {
	const { status, isLoading, isError, error, approve, deny } =
		useDeviceClaim(userCode)

	// State 4: invalid or missing user_code — render the same
	// "Expired" panel as a real expiry. Hiding the bad-URL
	// reason avoids telling an unauthenticated visitor why the
	// URL was malformed.
	if (!userCode) return <ExpiredPanel />

	// Surface read failures via the same panel; the failure
	// reasons are "user_code not found", "no session to
	// claim", or "server error", and the user action is the
	// same in every case: re-run `deesse auth login`.
	if (isError) return <ExpiredPanel reason={error?.message ?? ""} />

	if (status === "approved") return <ApprovedPanel />
	if (status === "denied") return <ExpiredPanel reason="denied" />

	const handleApprove = () => {
		approve.mutate(undefined, {
			onSuccess: () =>
				toast.success(
					"Device approved. You can close this tab and return to your terminal.",
				),
			onError: (err: Error) => toast.error(err.message),
		})
	}

	const handleDeny = () => {
		deny.mutate(undefined, {
			onSuccess: () => toast.success("Device request denied."),
			onError: (err: Error) => toast.error(err.message),
		})
	}

	// Loading: keep the pending panel shell; the read resolves
	// to either "pending" or one of the panels above on the
	// next render. The buttons only render once `status ===
	// "pending"` so the form does not flash clickable controls
	// before the query settles.
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col items-center gap-3 rounded-lg border p-6">
				<div className="flex size-12 items-center justify-center rounded-full border bg-muted">
					<ShieldCheckIcon className="size-5 text-muted-foreground" />
				</div>
				<p className="text-center text-sm text-muted-foreground">
					{isLoading
						? "Loading device request…"
						: "A device is requesting access to your DeesseJS account. Approve to let the CLI act on your behalf, or deny to cancel."}
				</p>
			</div>
			{status === "pending" && (
				<div className="flex flex-col gap-2">
					<Button
						type="button"
						disabled={approve.isPending || deny.isPending}
						onClick={handleApprove}
					>
						{approve.isPending ? "Approving…" : "Approve device"}
					</Button>
					<Button
						type="button"
						variant="outline"
						disabled={approve.isPending || deny.isPending}
						onClick={handleDeny}
					>
						{deny.isPending ? "Denying…" : "Deny"}
					</Button>
				</div>
			)}
		</div>
	)
}

function ExpiredPanel({ reason }: { reason?: string } = {}) {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col items-center gap-3 rounded-lg border p-6">
				<div className="flex size-12 items-center justify-center rounded-full border bg-muted">
					<ShieldXIcon className="size-5 text-muted-foreground" />
				</div>
				<p className="text-center text-sm text-muted-foreground">
					{reason ??
						"This code has expired or is invalid. Run `deesse auth login` again."}
				</p>
			</div>
			<Separator />
			<p className="text-center text-sm text-muted-foreground">
				<Link
					href="/home"
					className="text-primary underline-offset-4 hover:underline"
				>
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
				<Link
					href="/home"
					className="text-primary underline-offset-4 hover:underline"
				>
					Back to home
				</Link>
			</p>
		</div>
	)
}
