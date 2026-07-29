"use client"

import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

interface ProfileFormProps {
	name?: string
	email?: string
}

export function ProfileForm({ name = "", email = "" }: ProfileFormProps) {
	const [displayName, setDisplayName] = useState(name)
	const [submitting, setSubmitting] = useState(false)
	const [saved, setSaved] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!displayName.trim()) return

		setSubmitting(true)
		const { error } = await authClient.updateUser({
			name: displayName.trim(),
		})
		setSubmitting(false)

		if (error) {
			toast.error(error.message ?? "Failed to update profile")
			return
		}

		setSaved(true)
		setTimeout(() => setSaved(false), 3000)
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<label htmlFor="name" className="text-sm font-medium">Name</label>
				<Input
					id="name"
					name="name"
					value={displayName}
					onChange={(e) => setDisplayName(e.target.value)}
					autoComplete="name"
				/>
			</div>

			<div className="flex flex-col gap-2">
				<label className="text-sm font-medium">Email</label>
				<Input
					value={email}
					disabled
					autoComplete="email"
					className="text-muted-foreground"
				/>
				<p className="text-xs text-muted-foreground">
					Email changes require verification.{" "}
					<a href="/settings/account/email" className="text-primary hover:underline">
						Change email
					</a>
				</p>
			</div>

			{saved && (
				<p className="text-sm text-green-600 dark:text-green-400">
					Changes saved.
				</p>
			)}

			<div className="flex justify-end">
				<Button type="submit" disabled={submitting || displayName === name}>
					{submitting ? "Saving…" : saved ? "Saved" : "Save changes"}
				</Button>
			</div>
		</form>
	)
}
