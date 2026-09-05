"use client"

import { useRef, useState } from "react"
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
import { createOrganization } from "@/lib/actions/create-organization"

type CreatedOrg = {
	name: string
	slug: string
}

type CreateOrganizationDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => Promise<void> | void
	/**
	 * Called once better-auth confirms the new organization exists.
	 * The parent (TeamSwitcher) uses this hook to invalidate the
	 * atoms so the switcher re-renders with the new workspace.
	 */
	onCreated?: (org: CreatedOrg) => void
}

/**
 * Create-organization dialog driven by the shared server action
 * in `lib/actions/create-organization.ts`. The action routes the
 * user to /{slug}/home after creating the workspace and
 * switching the active org, so the dialog can rely on the
 * browser navigation the action triggers — no manual router
 * push needed.
 */
export function CreateOrganizationDialog({
	open,
	onOpenChange,
}: CreateOrganizationDialogProps) {
	const [submitting, setSubmitting] = useState(false)
	// Tracks whether the slug field has been manually touched. While
	// false, the slug is derived from the workspace name via
	// `slugify`. Mirrors the sync used by <CreateOrganizationForm>.
	const slugTouchedRef = useRef(false)

	const form = useForm({
		defaultValues: { name: "", slug: "" },
		canSubmitWhenInvalid: true,
		validators: { onSubmit: onboardingSchema },
		onSubmit: async ({ value }) => {
			setSubmitting(true)
			try {
				const slug = value.slug || slugify(value.name)
				await createOrganization({
					name: value.name,
					slug,
					next: "/{slug}/home",
				})
				// The server action redirects; this branch is unreachable
				// but kept for type-narrowing on the catch below.
			} catch (error) {
				// redirect() throws a NEXT_REDIRECT sentinel that we must
				// re-throw so the redirect actually fires. Filter for it
				// before reporting to the user.
				if (error instanceof Error && /NEXT_REDIRECT/.test(error.message)) {
					throw error
				}
				toast.error(
					error instanceof Error ? error.message : "Could not create workspace",
				)
				setSubmitting(false)
			}
		},
	})

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				onOpenChange(next)?.catch(() => {})
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
						form.handleSubmit().catch(() => {})
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
									onFocus={() => {
										slugTouchedRef.current = true
									}}
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

					{/*
					  Slug auto-fill from name. Mirrors the pattern in
					  <CreateOrganizationForm />: the user keeps manual
					  control as soon as they focus the slug field.
					*/}
					<form.Subscribe
						selector={(state) => state.values.name}
						children={(name) => {
							if (!slugTouchedRef.current) {
								const expected = slugify(name ?? "")
								if (expected !== form.getFieldValue("slug")) {
									form.setFieldValue("slug", expected)
								}
							}
							// Render an empty fragment so the children return
							// type stays JSX (sonarjs/no-invariant-returns).
							return <span hidden aria-hidden />
						}}
					/>
				</form>

				<DialogFooter>
					<Button
						type="button"
						variant="ghost"
						onClick={() => {
							onOpenChange(false)?.catch(() => {})
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