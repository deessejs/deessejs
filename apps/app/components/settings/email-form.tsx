"use client"

import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { safeRedirect } from "@workspace/utils/safe-redirect"

export function EmailForm() {
	const [email, setEmail] = useState("")
	const [sent, setSent] = useState(false)
	const [submitting, setSubmitting] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!email.trim()) return

		setSubmitting(true)
		const { error } = await authClient.sendVerificationEmail({
			email: email.trim(),
			// Validate even though the literal is hardcoded — defense-in-depth in
			// case this value becomes user-controlled in a future change.
			callbackURL: safeRedirect("/verify-email"),
		})
		setSubmitting(false)

		if (error) {
			toast.error(error.message ?? "Failed to send verification email")
			return
		}

		setSent(true)
	}

	if (sent) {
		return (
			<div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
				<p className="font-medium">Verification email sent</p>
				<p>Check your new email inbox to confirm the change.</p>
			</div>
		)
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<label htmlFor="email" className="text-sm font-medium">New email</label>
				<Input
					id="email"
					name="email"
					type="email"
					placeholder="new@example.com"
					autoComplete="email"
					required
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
			</div>

			<div className="flex justify-end">
				<Button type="submit" disabled={submitting || !email.trim()}>
					{submitting ? "Sending…" : "Send verification"}
				</Button>
			</div>
		</form>
	)
}
