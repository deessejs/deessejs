"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@workspace/ui/components/dialog"
import { safeRedirect } from "@workspace/utils/safe-redirect"
import { DangerZone } from "@/components/settings"

const CONFIRM_TEXT = "DELETE"

export function DeleteAccountDialog() {
	const [open, setOpen] = useState(false)
	const [confirm, setConfirm] = useState("")
	const [deleting, setDeleting] = useState(false)
	const [done, setDone] = useState(false)

	async function handleDelete() {
		if (confirm !== CONFIRM_TEXT) return
		setDeleting(true)
		const { error } = await authClient.deleteUser({
			// Validate even though the literal is hardcoded — defense-in-depth.
			callbackURL: safeRedirect("/login"),
		})
		setDeleting(false)
		if (error) {
			setConfirm("")
			return
		}
		setDone(true)
	}

	function handleCancel() {
		setOpen(false)
		setConfirm("")
	}

	if (done) {
		return (
			<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
				<p className="font-medium">Account deleted</p>
				<p>You have been signed out. Your account and data have been permanently removed.</p>
			</div>
		)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DangerZone
				title="Delete account"
				description="Permanently delete your account and all associated data. This action cannot be undone."
			>
				<DialogTrigger asChild>
					<Button variant="destructive" size="sm">
						Delete account
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete your account?</DialogTitle>
						<DialogDescription>
							This action is permanent. All your data will be deleted and cannot be recovered.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-2">
						<p className="text-sm text-muted-foreground">
							Type <strong>{CONFIRM_TEXT}</strong> to confirm.
						</p>
						<Input
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
							placeholder={CONFIRM_TEXT}
							autoComplete="off"
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={handleCancel}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={confirm !== CONFIRM_TEXT || deleting}
							onClick={handleDelete}
						>
							{deleting ? "Deleting…" : "Delete account"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</DangerZone>
		</Dialog>
	)
}
