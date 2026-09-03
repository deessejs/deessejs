"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { Building2, Sparkles } from "lucide-react"

import { Field } from "@/components/auth/field"
import { onboardingSchema, slugify } from "@/components/auth/schemas"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"

type CreateOrganizationFormProps = {
	/** Path to navigate to after a successful submit. Defaults to /home. */
	nextHref?: string
}

export function CreateOrganizationForm({ nextHref = "/home" }: CreateOrganizationFormProps) {
	const router = useRouter()
	// Tracks whether the user has manually focused/edited the slug
	// field. While false, slug is derived from the name field via
	// `slugify`. Once true, the auto-fill stops so we never overwrite
	// a deliberate edit.
	const slugTouchedRef = useRef(false)

	const form = useForm({
		defaultValues: {
			name: "",
			slug: "",
		},
		canSubmitWhenInvalid: true,
		validators: {
			onSubmit: onboardingSchema,
		},
		onSubmit: async () => {
			// Dummy: no backend. ADR-030 PR #4 will wire
			// `authClient.organization.createOrganization(...)` here.
			router.push(nextHref)
		},
	})

	return (
		<>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					void form.handleSubmit()
				}}
				noValidate
				className="flex flex-col gap-5"
			>
				<Field
					form={form}
					name="name"
					label="Organization name"
					autoComplete="organization"
					autoFocus
				/>

				<Field
					form={form}
					name="slug"
					label="URL slug"
					autoComplete="off"
					onFocus={() => {
						// First focus marks the slug as user-owned. From
						// here on, name → slug auto-fill stops so we never
						// overwrite deliberate edits.
						slugTouchedRef.current = true
					}}
				/>

				<div className="rounded-md border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
					<div className="flex items-start gap-2">
						<Sparkles className="mt-0.5 size-4 shrink-0" />
						<p>
							You&apos;ll be the <span className="font-medium text-foreground">owner</span>{" "}
							of this organization. You can invite teammates and assign roles from{" "}
							<span className="font-medium text-foreground">Settings → Members</span>{" "}
							after onboarding.
						</p>
					</div>
				</div>

				{/*
				  Slug auto-fill from name. Runs whenever the name field
				  changes: while the user has not touched the slug, we
				  mirror the slugified name. Once focused, the ref flips
				  and we leave the slug alone.
				*/}
				<form.Subscribe
					selector={(state) => state.values.name}
					children={(name) => {
						if (!slugTouchedRef.current) {
							const next = slugify(name ?? "")
							if (next !== form.getFieldValue("slug")) {
								form.setFieldValue("slug", next)
							}
						}
						// Render an empty fragment so the children return
						// type stays JSX (sonarjs/no-invariant-returns).
						return <span hidden aria-hidden />
					}}
				/>

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting] as const}
					children={([canSubmit, isSubmitting]) => (
						<Button type="submit" disabled={!canSubmit} aria-busy={isSubmitting}>
							<Building2 className="size-4" />
							{isSubmitting ? "Creating workspace…" : "Create workspace"}
						</Button>
					)}
				/>
			</form>

			<div className="relative my-6">
				<div className="absolute inset-0 flex items-center">
					<Separator className="w-full" />
				</div>
				<div className="relative flex justify-center text-xs uppercase">
					<span className="bg-background px-2 text-muted-foreground">Or</span>
				</div>
			</div>

			<div className="flex flex-col gap-3">
				<Button variant="outline" type="button" disabled>
					Join with an invite code
				</Button>
				<p className="text-center text-xs text-muted-foreground">
					Invitations are visible once your team admin sends one.
				</p>
			</div>
		</>
	)
}