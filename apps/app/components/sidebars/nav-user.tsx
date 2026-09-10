"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { LogOutIcon } from "lucide-react"
import { authClient } from "@/lib/auth-client"

const VERCEL_AVATAR_BASE = "https://vercel.com/api/www/avatar"

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean)
	if (parts.length === 0) return "?"
	if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
	return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

function getAvatarUrl(email: string, image?: string | null): string {
	if (image) return image
	return `${VERCEL_AVATAR_BASE}?s=40&u=${encodeURIComponent(email)}&dpl=dpl_AS99V7XmtTzE4xdb72tYFtNTVV48`
}

export function NavUser() {
	const router = useRouter()
	// Top-level hook call: component top-level is a valid hook context per
	// React's rules. The audit §3.5 bug was calling useSession() inside an
	// async callback (useCallback body), which IS a violation. Here at
	// top-level, useSession() is correct.
	// eslint-disable-next-line no-restricted-syntax
	const { data: session } = authClient.useSession()
	const [loggingOut, setLoggingOut] = useState(false)
	const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

	const user = session?.user

	async function handleLogout() {
		setLoggingOut(true)
		setLogoutDialogOpen(false)
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => router.push("/login"),
			},
		})
	}

	// No session — render an anonymous "Guest" placeholder
	if (!user) {
		return (
			<Avatar className="h-8 w-8 rounded-lg">
				<AvatarFallback className="rounded-lg">?</AvatarFallback>
			</Avatar>
		)
	}

	const avatarUrl = getAvatarUrl(user.email, user.image)
	const initials = getInitials(user.name)

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="size-9 rounded-full p-0"
						aria-label="Open user menu"
					>
						<Avatar className="h-8 w-8 rounded-lg">
							<AvatarImage src={avatarUrl} alt={user.name} />
							<AvatarFallback className="rounded-lg">
								{initials}
							</AvatarFallback>
						</Avatar>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-56" align="end" sideOffset={4}>
					<DropdownMenuItem
						onClick={() => setLogoutDialogOpen(true)}
						disabled={loggingOut}
					>
						<LogOutIcon />
						Log out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Log out?</DialogTitle>
						<DialogDescription>
							You will be signed out of your account.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setLogoutDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button onClick={handleLogout} disabled={loggingOut}>
							{loggingOut ? "Signing out…" : "Log out"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
