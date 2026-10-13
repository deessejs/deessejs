"use client"

import { useState } from "react"
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
import { authClient } from "@/lib/auth-client"

interface CreateOrganizationDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onCreated: (slug: string) => void
}

/**
 * Create-organization dialog opened from the sidebar switcher (Q15).
 * Collects the organization name; the slug is generated server-side
 * by the plugin (RFC-001 §6) and returned in the response, so the
 * client does not preview a candidate.
 *
 * The dialog disables submit while the request is in flight and
 * surfaces server-side errors inline. On success, the parent
 * navigates to `/<slug>/home`.
 */
export function CreateOrganizationDialog({
	open,
	onOpenChange,
	onCreated,
}: CreateOrganizationDialogProps) {
	const [name, setName] = useState("")
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault()
		if (!name.trim()) return
		setSubmitting(true)
		setError(null)
		try {
			const result = await authClient.organization.create({ name: name.trim() })
			if (!result || "error" in result) {
				const message =
					(result as { error?: { message?: string } })?.error?.message ??
					"Failed to create organization"
				setError(message)
				return
			}
			const slug = (result as { slug?: string }).slug
			if (!slug) {
				setError("Server did not return a slug")
				return
			}
			await authClient.organization.setActive({
				organizationId: (result as { id: string }).id,
			})
			onCreated(slug)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error")
		} finally {
			setSubmitting(false)
		}
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
							disabled={submitting}
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
						disabled={submitting}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						form="create-organization"
						disabled={submitting || !name.trim()}
					>
						{submitting ? "Creating…" : "Create"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
