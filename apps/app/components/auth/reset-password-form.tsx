"use client"

import { useResetPassword } from "@/hooks/use-auth-form-mutations"
import Link from "next/link"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { PasswordField } from "./field"
import { resetPasswordSchema } from "@/components/auth/schemas"

interface ResetPasswordFormProps {
	token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
	const resetPassword = useResetPassword(token)

	const form = useForm({
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
		validators: {
			onSubmit: resetPasswordSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				await resetPassword.mutateAsync(value.password)
			} catch (error) {
				toast.error(error instanceof Error ? error.message : "Could not reset password")
			}
		},
	})

	if (resetPassword.isSuccess) {
		return (
			<div className="flex flex-col gap-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
				<p className="font-medium">Password updated</p>
				<p>Your password has been reset. You can now log in.</p>
				<Link
					href="/login"
					className="text-primary underline-offset-4 hover:underline"
				>
					Back to login
				</Link>
			</div>
		)
	}

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
				<form.Field name="password">
					{(field) => (
						<PasswordField
							field={field}
							label="New password"
							autoComplete="new-password"
						/>
					)}
				</form.Field>

				<form.Field name="confirmPassword">
					{(field) => (
						<PasswordField
							field={field}
							label="Confirm password"
							autoComplete="new-password"
						/>
					)}
				</form.Field>

				<form.Subscribe
					selector={(state) => state.canSubmit}
				>
					{(canSubmit) => (
						<Button
							type="submit"
							disabled={!canSubmit || resetPassword.isPending}
							aria-busy={resetPassword.isPending}
						>
							{resetPassword.isPending ? "Resetting…" : "Reset password"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</div>
	)
}
