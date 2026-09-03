"use client"

import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { Building2, Sparkles } from "lucide-react"

import { Field } from "@/components/auth/field"
import { onboardingSchema } from "@/components/auth/schemas"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"

export function CreateOrganizationForm() {
	const router = useRouter()

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
			router.push("/home")
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