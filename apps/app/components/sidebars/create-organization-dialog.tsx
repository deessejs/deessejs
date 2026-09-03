"use client"

import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { onboardingSchema, slugify } from "@/components/auth/schemas"

type CreateOrganizationDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => Promise<void> | void
	onCreated?: (org: { id: string; slug: string; name: string }) => void
}

/**
 * Dummy create-organization dialog. The submit handler builds an
 * in-memory row, hands it back to the caller for direct insertion
 * into the workspace list, and resets. PR #4 wires the real
 * better-auth `authClient.organization.createOrganization({...})`
 * call and replaces the form values with the API response.
 */
export function CreateOrganizationDialog({
	open,
	onOpenChange,
	onCreated,
}: CreateOrganizationDialogProps) {
	const [submitting, setSubmitting] = useState(false)
	const form = useForm({
		defaultValues: { name: "", slug: "" },
		canSubmitWhenInvalid: true,
		validators: { onSubmit: onboardingSchema },
		onSubmit: async ({ value }) => {
			setSubmitting(true)
			try {
				const slug = value.slug || slugify(value.name)
				await new Promise((resolve) => setTimeout(resolve, 200))
				onCreated?.({
					id: `org_${slug}`,
					slug,
					name: value.name,
				})
				toast.success(`Workspace "${value.name}" created.`)
				form.reset()
				await onOpenChange(false)
			} finally {
				setSubmitting(false)
			}
		},
	})

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				void onOpenChange(next)
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Create a workspace</DialogTitle>
					<DialogDescription>
						Workspaces group your projects, members, and settings. You
						can create more or join via invitation later.
					</DialogDescription>
				</DialogHeader>

				<form
					id="create-org-form"
					onSubmit={(event) => {
						event.preventDefault()
						void form.handleSubmit()
					}}
					className="flex flex-col gap-4"
				>
					<form.Field name="name">
						{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
						{(field: any) => (
							<div className="flex flex-col gap-2">
								<label htmlFor="org-name" className="text-sm font-medium">
									Workspace name
								</label>
								<Input
									id="org-name"
									name={field.name}
									autoFocus
									value={field.state.value}
									onChange={(event) => field.handleChange(event.target.value)}
									aria-invalid={!!field.state.meta.errors.length}
									placeholder="Acme Corp"
								/>
								{field.state.meta.errors.map(
									/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
									(err: any) => (
										<p
											key={err?.message}
											className="text-sm text-destructive"
											role="alert"
										>
											{err?.message}
										</p>
									),
								)}
							</div>
						)}
					</form.Field>

					<form.Field name="slug">
						{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
						{(field: any) => (
							<div className="flex flex-col gap-2">
								<label htmlFor="org-slug" className="text-sm font-medium">
									URL slug
								</label>
								<Input
									id="org-slug"
									name={field.name}
									value={field.state.value}
									onChange={(event) => field.handleChange(event.target.value)}
									aria-invalid={!!field.state.meta.errors.length}
									placeholder="acme-corp"
								/>
								{field.state.meta.errors.map(
									/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
									(err: any) => (
										<p
											key={err?.message}
											className="text-sm text-destructive"
											role="alert"
										>
											{err?.message}
										</p>
									),
								)}
							</div>
						)}
					</form.Field>
				</form>

				<DialogFooter>
					<Button
						type="button"
						variant="ghost"
						onClick={() => {
							void onOpenChange(false)
						}}
						disabled={submitting}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						form="create-org-form"
						disabled={submitting}
						aria-busy={submitting}
					>
						{submitting ? "Creating…" : "Create workspace"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}