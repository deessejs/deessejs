"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { createAdditionalOrganization } from "@/lib/organization-onboarding"

interface CreateOrganizationDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onCreated: (slug: string) => void
}

/**
 * Create-organization dialog opened from the sidebar switcher (Q15).
 * Collects the organization name; the slug is generated server-side
 * by the Server Action's `buildRandomSlugCandidate` and returned in
 * the response, so the client does not preview a candidate.
 *
 * The dialog calls the `createAdditionalOrganization` Server Action
 * (not `authClient.organization.create`) so the additional-org
 * path is centralized: the `prepareOrganizationCreation` hook
 * returns `{}` for additional orgs (the marker is a one-time
 * correlation pointer for the first org), and the response is a
 * clean `{ ok, slug, organizationId }` shape. The dialog renders
 * server-side errors inline. On success, the parent navigates to
 * `/<slug>/home`.
 */
export function CreateOrganizationDialog({
	open,
	onOpenChange,
	onCreated,
}: CreateOrganizationDialogProps) {
	const router = useRouter()
	const [name, setName] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [pending, startTransition] = useTransition()

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault()
		const trimmed = name.trim()
		if (!trimmed) return
		setError(null)
		startTransition(async () => {
			const result = await createAdditionalOrganization({ name: trimmed })
			if (!result.ok) {
				setError(result.error)
				return
			}
			onCreated(result.slug)
			// Force a refresh so the sidebar re-hydrates with the
			// new membership in its server-rendered list.
			router.refresh()
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create organization</DialogTitle>
					<DialogDescription>
						The slug is generated from the name. You can rename the
						display name later.
					</DialogDescription>
				</DialogHeader>
				<form
					id="create-organization"
					onSubmit={handleSubmit}
					className="flex flex-col gap-3"
				>
					<label className="flex flex-col gap-1 text-sm">
						<span className="font-medium">Name</span>
						<Input
							autoFocus
							required
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Acme Inc"
							disabled={pending}
						/>
					</label>
					{error && (
						<p className="text-sm text-destructive" role="alert">
							{error}
						</p>
					)}
				</form>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={pending}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						form="create-organization"
						disabled={pending || !name.trim()}
					>
						{pending ? "Creating…" : "Create"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
