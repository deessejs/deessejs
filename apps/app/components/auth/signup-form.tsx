"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { OAuthButtons } from "./oauth-buttons"
import { Field, PasswordField } from "./field"
import { PasswordStrength } from "./password-strength"
import { signupSchema } from "@/components/auth/schemas"

export function SignupForm() {
	const router = useRouter()

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
		validators: {
			onSubmit: signupSchema,
		},
		onSubmit: async ({ value }) => {
			const { error } = await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
				},
				{
					onSuccess: () => router.push("/verify-email"),
				},
			)
			if (error) {
				toast.error(error.message ?? "Could not create account")
			}
		},
	})

	return (
		<div className="flex flex-col gap-6">
			<form
				onSubmit={(e) => {
					e.preventDefault()
					void form.handleSubmit()
				}}
				noValidate
				className="flex flex-col gap-4"
			>
				<Field
					form={form}
					name="name"
					label="Name"
					autoComplete="name"
					autoFocus
				/>

				<Field
					form={form}
					name="email"
					label="Email"
					type="email"
					autoComplete="email"
				/>

				<PasswordField
					form={form}
					name="password"
					label="Password"
					autoComplete="new-password"
				>
					{(value) => <PasswordStrength password={value} />}
				</PasswordField>

				<PasswordField
					form={form}
					name="confirmPassword"
					label="Confirm password"
					autoComplete="new-password"
				/>

				<p className="text-xs text-muted-foreground">
					By creating an account, you agree to our{" "}
					<Link href="/terms" className="text-primary underline-offset-4 hover:underline">
						Terms of Service
					</Link>{" "}
					and{" "}
					<Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
						Privacy Policy
					</Link>
					.
				</p>

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting] as const}
					children={([canSubmit, isSubmitting]) => (
						<Button type="submit" disabled={!canSubmit} aria-busy={isSubmitting}>
							{isSubmitting ? "Creating account…" : "Create account"}
						</Button>
					)}
				/>
			</form>

			<div className="relative">
				<div className="absolute inset-0 flex items-center">
					<Separator className="w-full" />
				</div>
				<div className="relative flex justify-center text-xs uppercase">
					<span className="bg-background px-2 text-muted-foreground">
						Or continue with
					</span>
				</div>
			</div>

			<OAuthButtons />

			<p className="text-center text-sm text-muted-foreground">
				Already have an account?{" "}
				<Link href="/login" className="text-primary underline-offset-4 hover:underline">
					Log in
				</Link>
			</p>
		</div>
	)
}