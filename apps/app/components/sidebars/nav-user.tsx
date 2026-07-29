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
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@workspace/ui/components/sidebar"
import {
	ChevronsUpDownIcon,
	SparklesIcon,
	BadgeCheckIcon,
	CreditCardIcon,
	BellIcon,
	LogOutIcon,
} from "lucide-react"
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
	const { isMobile } = useSidebar()
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
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton size="lg" disabled>
						<Avatar className="h-8 w-8 rounded-lg">
							<AvatarFallback className="rounded-lg">?</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">Guest</span>
							<span className="truncate text-xs">Not signed in</span>
						</div>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		)
	}

	const avatarUrl = getAvatarUrl(user.email, user.image)
	const initials = getInitials(user.name)

	return (
		<>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							>
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage src={avatarUrl} alt={user.name} />
									<AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{user.name}</span>
									<span className="truncate text-xs">{user.email}</span>
								</div>
								<ChevronsUpDownIcon className="ml-auto size-4" />
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-fit"
							side={isMobile ? "bottom" : "right"}
							align="end"
							sideOffset={4}
						>
							<DropdownMenuLabel className="p-0 font-normal">
								<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
									<Avatar className="h-8 w-8 rounded-lg">
										<AvatarImage src={avatarUrl} alt={user.name} />
										<AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-medium">{user.name}</span>
										<span className="truncate text-xs">{user.email}</span>
									</div>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem>
									<SparklesIcon />
									Upgrade to Pro
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem>
									<BadgeCheckIcon />
									Account
								</DropdownMenuItem>
								<DropdownMenuItem>
									<CreditCardIcon />
									Billing
								</DropdownMenuItem>
								<DropdownMenuItem>
									<BellIcon />
									Notifications
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => setLogoutDialogOpen(true)}
								disabled={loggingOut}
							>
								<LogOutIcon />
								Log out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>

			<Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Log out?</DialogTitle>
						<DialogDescription>
							You will be signed out of your account.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
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
