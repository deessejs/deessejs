"use client"

import { useRef } from "react"
import { useForm } from "@tanstack/react-form"
import { Building2, Sparkles } from "lucide-react"

import { Field } from "@/components/auth/field"
import { onboardingSchema, slugify } from "@/components/auth/schemas"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"

type CreateOrganizationFormProps = {
	/** Server action wired at the page level. Receives FormData with
	 *  fields `name` and `slug` populated from the form. */
	action: (formData: FormData) => Promise<void>
}

/**
 * Create-organization form bound to a server action. The Client
 * Component handles validation UX (inline errors, auto-slug),
 * the actual mutation runs server-side via the action prop.
 *
 * The form's `<input>` elements drive the hidden submission via
 * native form action — TanStack Form mirrors its values into
 * hidden inputs so the server action sees the data as FormData.
 */
export function CreateOrganizationForm({ action }: CreateOrganizationFormProps) {
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
		// Server action handles validation; we don't block submission
		// when client-side validation has open errors.
		canSubmitWhenInvalid: true,
		validators: {
			onSubmit: onboardingSchema,
		},
		// TanStack's onSubmit is a no-op — native form submission
		// drives the action. We only run the validator to surface
		// inline errors before submission.
		onSubmit: () => undefined,
	})

	return (
		<>
			<form
				action={action}
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
				  Slug auto-fill from name. The user keeps manual
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

				{/* Hidden inputs bridge TanStack Form values to native
				    form submission so the server action sees the data. */}
				<form.Subscribe
					selector={(state) => state.values}
					children={(values) => (
						<>
							<input type="hidden" name="name" value={values.name ?? ""} />
							<input type="hidden" name="slug" value={values.slug ?? ""} />
						</>
					)}
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
