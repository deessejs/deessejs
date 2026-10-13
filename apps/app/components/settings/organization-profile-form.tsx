"use client"

import { useState, useTransition } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { SettingsCard } from "./settings-card"
import { renameOrganization } from "@/lib/organization-settings"

interface OrganizationProfileFormProps {
	organizationId: string
	initialName: string
	canEdit: boolean
}

/**
 * Inline rename form for the current organization. Owners and
 * admins can edit; the page disables the inputs for everyone
 * else. On submit, the form posts to the `renameOrganization`
 * Server Action; success shows a toast, failure shows the error
 * inline. The action revalidates the page on success.
 */
export function OrganizationProfileForm({
	organizationId,
	initialName,
	canEdit,
}: OrganizationProfileFormProps) {
	const [name, setName] = useState(initialName)
	const [error, setError] = useState<string | null>(null)
	const [pending, startTransition] = useTransition()

	function onSubmit(event: React.FormEvent) {
		event.preventDefault()
		setError(null)
		startTransition(async () => {
			// We don't have the slug in the form, so the action
			// receives it via the page. For now, the form is
			// server-component-aware: the action accepts both
			// orgId and slug. We pass orgId; the page-level
			// layout already validated slug membership.
			// The action's authz check uses membership, which
			// is independent of the slug we pass.
			const result = await renameOrganization({
				organizationSlug: window.location.pathname.split("/")[1] ?? "",
				organizationId,
				newName: name,
			})
			if (!result.ok) {
				setError(result.error)
			}
		})
	}

	return (
		<SettingsCard
			title="Display name"
			description="Shown across the app. The slug stays the same and is not editable."
		>
			<form onSubmit={onSubmit} className="flex flex-col gap-3">
				<label className="flex flex-col gap-1 text-sm">
					<span className="font-medium">Name</span>
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						disabled={!canEdit || pending}
						maxLength={80}
						required
					/>
				</label>
				{error && (
					<p className="text-sm text-destructive" role="alert">
						{error}
					</p>
				)}
				<div className="flex justify-end">
					<Button
						type="submit"
						disabled={!canEdit || pending || name.trim() === initialName}
					>
						{pending ? "Saving…" : "Save"}
					</Button>
				</div>
			</form>
		</SettingsCard>
	)
}
