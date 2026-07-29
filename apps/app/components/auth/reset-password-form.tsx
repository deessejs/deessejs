"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { PasswordField } from "./field"
import { resetPasswordSchema } from "@/components/auth/schemas"

interface ResetPasswordFormProps {
	token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
	const [done, setDone] = useState(false)

	const form = useForm({
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
		validators: {
			onSubmit: resetPasswordSchema,
		},
		onSubmit: async ({ value }) => {
			const { error } = await authClient.resetPassword(
				{ newPassword: value.password },
				{
					query: { token },
					onSuccess: () => {
						setDone(true)
					},
				},
			)
			if (error) {
				toast.error(error.message ?? "Could not reset password")
			}
		},
	})

	if (done) {
		return (
			<div className="flex flex-col gap-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
				<p className="font-medium">Password updated</p>
				<p>Your password has been reset. You can now log in.</p>
				<Link href="/login" className="text-primary underline-offset-4 hover:underline">
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
				<PasswordField
					form={form}
					name="password"
					label="New password"
					autoComplete="new-password"
				/>

				<PasswordField
					form={form}
					name="confirmPassword"
					label="Confirm password"
					autoComplete="new-password"
				/>

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting] as const}
					children={([canSubmit, isSubmitting]) => (
						<Button type="submit" disabled={!canSubmit} aria-busy={isSubmitting}>
							{isSubmitting ? "Resetting…" : "Reset password"}
						</Button>
					)}
				/>
			</form>
		</div>
	)
}