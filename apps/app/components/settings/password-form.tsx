"use client"

import { useChangePassword } from "@/hooks/use-settings-mutations"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { PasswordInput } from "@/components/auth/password-input"

export function PasswordForm() {
	const [currentPassword, setCurrentPassword] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
  const changePassword = useChangePassword()

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

    changePassword.mutate({ currentPassword, newPassword }, {
      onSuccess: () => {
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      },
      onError: (error) => toast.error(error.message),
    })
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			{changePassword.isSuccess && (
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
        <Button type="submit" disabled={changePassword.isPending}>
			{changePassword.isPending ? "Updating…" : "Update password"}
				</Button>
			</div>
		</form>
	)
}
