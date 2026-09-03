"use client"

import { useRef, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
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
import { getAvatarUrl } from "@/lib/avatar"

type CreatedOrg = {
	id: string
	slug: string
	name: string
	logo?: string | null
}

type CreateOrganizationDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => Promise<void> | void
	onCreated?: (org: CreatedOrg) => void
}

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean)
	if (parts.length === 0) return "?"
	if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
	return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

/**
 * Dummy create-organization dialog. The submit handler builds an
 * in-memory row (with a Vercel-style avatar URL — same CDN helper
 * already used by <NavUser />), hands it back to the caller for
 * direct insertion into the workspace list, and resets. PR #4 wires
 * the real better-auth `authClient.organization.createOrganization`
 * call and replaces the dialog's handcrafted row with the API
 * response.
 */
export function CreateOrganizationDialog({
	open,
	onOpenChange,
	onCreated,
}: CreateOrganizationDialogProps) {
	const [submitting, setSubmitting] = useState(false)
	const [previewName, setPreviewName] = useState("")
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
				await new Promise((resolve) => setTimeout(resolve, 200))
				const slug = value.slug || slugify(value.name)
				onCreated?.({
					id: `org_${slug}`,
					slug,
					name: value.name,
					logo: getAvatarUrl(`org_${slug}`, { size: 64 }),
				})
				toast.success(`Workspace "${value.name}" created.`)
				form.reset()
				slugTouchedRef.current = false
				setPreviewName("")
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
				// Promise-returning callback — swallow the rejection at the
				// call site so an upstream error doesn't escape Radix's
				// onOpenChange handler as an unhandled promise.
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

				<div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2">
					<Avatar className="size-10 rounded-md">
						<AvatarImage
							src={getAvatarUrl(`preview_${slugify(previewName || "new")}`, {
								size: 64,
							})}
							alt="Workspace preview"
						/>
						<AvatarFallback className="rounded-md">
							{getInitials(previewName) || "?"}
						</AvatarFallback>
					</Avatar>
					<p className="text-xs text-muted-foreground">
						Your workspace gets a unique avatar from the Vercel CDN —
						deterministic per slug.
					</p>
				</div>

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
									onChange={(event) => {
										field.handleChange(event.target.value)
										setPreviewName(event.target.value)
									}}
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