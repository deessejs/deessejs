"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog"
import { deleteOrganization } from "@/lib/organization-settings"

interface DeleteOrganizationZoneProps {
	organizationSlug: string
	organizationName: string
}

/**
 * Destructive zone: delete the current organization. The button
 * is owner-only (the page hides the zone for non-owners).
 *
 * The dialog asks the user to type the organization's display
 * name verbatim to arm the action. RFC-001 §7 "destructive
 * actions must require role checks AND a typed confirmation":
 * the page-level layout enforces role, this dialog enforces the
 * typed confirmation.
 *
 * The Server Action `deleteOrganization` ignores any client-
 * supplied `organizationId` and re-resolves the org by slug from
 * the database; we therefore pass only the slug here. The page
 * provides it from the route param so we never depend on
 * `window.location` parsing.
 *
 * The plugin's `beforeDeleteOrganization` hook blocks deletion
 * of any organization referenced by an
 * `account_organization_defaults` row (the permanent default
 * invariant). The application check here is a UX guard; the
 * database `ON DELETE RESTRICT` is the last line of defense.
 */
export function DeleteOrganizationZone({
	organizationSlug,
	organizationName,
}: DeleteOrganizationZoneProps) {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [confirmation, setConfirmation] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [pending, startTransition] = useTransition()

	function onConfirm(event: React.FormEvent) {
		event.preventDefault()
		setError(null)
		startTransition(async () => {
			const result = await deleteOrganization({
				organizationSlug,
				confirmation,
			})
			if (!result.ok) {
				setError(result.error)
				return
			}
			// Navigate to the account home. The deleted org is
			// gone; the user lands on `/` (which the layout
			// resolves to the default org or the onboarding
			// wizard).
			router.push("/")
		})
	}

	return (
		<div className="rounded-lg border border-destructive/30">
			<div className="flex flex-col gap-1.5 border-b border-destructive/30 px-4 py-4">
				<h2 className="text-base font-medium text-destructive">
					Danger zone
				</h2>
				<p className="text-sm text-muted-foreground">
					Delete this organization. All members, invitations, and
					data tied to it will be removed. This cannot be undone.
				</p>
			</div>
			<div className="flex items-center justify-between gap-3 p-4">
				<p className="text-sm">
					Deleting <strong>{organizationName}</strong> requires you
					to type its name to confirm.
				</p>
				<Button
					variant="destructive"
					onClick={() => setOpen(true)}
					disabled={pending}
				>
					{pending ? "Deleting…" : "Delete organization"}
				</Button>
			</div>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Delete {organizationName}?
						</DialogTitle>
						<DialogDescription>
							This is permanent. Type the organization's name
							exactly to arm the delete button.
						</DialogDescription>
					</DialogHeader>
					<form
						id="delete-organization"
						onSubmit={onConfirm}
						className="flex flex-col gap-3"
					>
						<label className="flex flex-col gap-1 text-sm">
							<span className="font-medium">
								Type{" "}
								<code className="rounded bg-muted px-1 py-0.5 text-xs">
									{organizationName}
								</code>{" "}
								to confirm
							</span>
							<Input
								autoFocus
								value={confirmation}
								onChange={(e) => setConfirmation(e.target.value)}
								required
								disabled={pending}
							/>
						</label>
						{error && (
							<p
								className="text-sm text-destructive"
								role="alert"
							>
								{error}
							</p>
						)}
					</form>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={pending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							form="delete-organization"
							variant="destructive"
							disabled={
								pending ||
								confirmation.trim() !== organizationName
							}
						>
							{pending ? "Deleting…" : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
