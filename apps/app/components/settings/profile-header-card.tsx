"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import { authClient } from "@/lib/auth-client"

function getInitials(name: string, email: string): string {
	const source = name.trim() || email.trim()
	const parts = source.split(/\s+/).filter(Boolean)
	if (parts.length === 0) return "?"
	if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
	return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

const VERCEL_AVATAR_BASE = "https://vercel.com/api/www/avatar"

function getAvatarUrl(email: string, image?: string | null): string {
	if (image) return image
	return `${VERCEL_AVATAR_BASE}?s=160&u=${encodeURIComponent(email)}&dpl=dpl_AS99V7XmtTzE4xdb72tYFtNTVV48`
}

/**
 * Combined "Public profile" card on /settings/profile: avatar (with a
 * disabled Change avatar button as V1 placeholder) and name form. The
 * email is read-only here; the Email card below handles changes.
 */
export function ProfileHeaderCard() {
	// eslint-disable-next-line no-restricted-syntax
	const { data: session } = authClient.useSession()
	const user = session?.user
	const [displayName, setDisplayName] = useState(user?.name ?? "")
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

	const name = user?.name ?? ""
	const email = user?.email ?? ""
	const initials = getInitials(name, email)
	const avatarUrl = getAvatarUrl(email, user?.image)

	return (
		<div className="flex flex-col gap-6 sm:flex-row sm:items-start">
			<div className="flex flex-col items-center gap-3 sm:w-48">
				<Avatar className="size-24 rounded-lg">
					{user?.image && (
						<AvatarImage src={avatarUrl} alt={name || email} />
					)}
					<AvatarFallback className="rounded-lg text-2xl">
						{initials}
					</AvatarFallback>
				</Avatar>
				<Button
					variant="outline"
					size="sm"
					type="button"
					disabled
					aria-disabled
					title="Avatar upload is not available yet"
				>
					Change avatar
				</Button>
			</div>
			<form
				onSubmit={handleSubmit}
				className="flex flex-1 flex-col gap-4"
			>
				<div className="flex flex-col gap-2">
					<label htmlFor="name" className="text-sm font-medium">
						Name
					</label>
					<Input
						id="name"
						name="name"
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
						autoComplete="name"
						placeholder="Your name"
					/>
				</div>

				{saved && (
					<p className="text-sm text-green-600 dark:text-green-400">
						Changes saved.
					</p>
				)}

				<div className="flex justify-end">
					<Button
						type="submit"
						disabled={submitting || displayName === name}
					>
						{submitting ? "Saving…" : saved ? "Saved" : "Save changes"}
					</Button>
				</div>
			</form>
		</div>
	)
}
