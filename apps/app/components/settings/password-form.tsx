"use client"

import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { PasswordInput } from "@/components/auth/password-input"

export function PasswordForm() {
	const [currentPassword, setCurrentPassword] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [submitting, setSubmitting] = useState(false)
	const [saved, setSaved] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()

		if (newPassword !== confirmPassword) {
			toast.error("Passwords do not match")
			return
		}

		if (newPassword.length < 8) {
			toast.error("Password must be at least 8 characters")
			return
		}

		setSubmitting(true)
		const { error } = await authClient.changePassword({
			currentPassword,
			newPassword,
		})
		setSubmitting(false)

		if (error) {
			toast.error(error.message ?? "Failed to update password")
			return
		}

		setSaved(true)
		setCurrentPassword("")
		setNewPassword("")
		setConfirmPassword("")
		setTimeout(() => setSaved(false), 3000)
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			{saved && (
				<p className="text-sm text-green-600 dark:text-green-400">
					Password updated.
				</p>
			)}

			<div className="flex flex-col gap-2">
				<label htmlFor="current" className="text-sm font-medium">Current password</label>
				<PasswordInput
					id="current"
					name="current"
					autoComplete="current-password"
					value={currentPassword}
					onChange={(e) => setCurrentPassword(e.target.value)}
				/>
			</div>

			<div className="flex flex-col gap-2">
				<label htmlFor="new" className="text-sm font-medium">New password</label>
				<PasswordInput
					id="new"
					name="new"
					autoComplete="new-password"
					value={newPassword}
					onChange={(e) => setNewPassword(e.target.value)}
				/>
			</div>

			<div className="flex flex-col gap-2">
				<label htmlFor="confirm" className="text-sm font-medium">Confirm new password</label>
				<PasswordInput
					id="confirm"
					name="confirm"
					autoComplete="new-password"
					value={confirmPassword}
					onChange={(e) => setConfirmPassword(e.target.value)}
				/>
			</div>

			<div className="flex justify-end">
				<Button type="submit" disabled={submitting}>
					{submitting ? "Updating…" : "Update password"}
				</Button>
			</div>
		</form>
	)
}
