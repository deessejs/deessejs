"use client"

import { useSendEmailChangeVerification } from "@/hooks/use-settings-mutations"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { safeRedirect } from "@workspace/utils/safe-redirect"

export function EmailForm() {
	const [email, setEmail] = useState("")
  const sendVerification = useSendEmailChangeVerification()

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!email.trim()) {
			return
		}

    sendVerification.mutate({
      email: email.trim(),
			// Validate even though the literal is hardcoded — defense-in-depth in
			// case this value becomes user-controlled in a future change.
      callbackURL: safeRedirect("/verify-email"),
    }, { onError: (error) => toast.error(error.message) })
	}

	if (sendVerification.isSuccess) {
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
        <Button type="submit" disabled={sendVerification.isPending || !email.trim()}>
			{sendVerification.isPending ? "Sending…" : "Send verification"}
				</Button>
			</div>
		</form>
	)
}
