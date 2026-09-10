"use client"

import Link from "next/link"
import { useState } from "react"
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
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
	LayoutDashboardIcon,
	LogOutIcon,
} from "lucide-react"

import { useAuthClient } from "./auth-client-provider"
import { getAvatarUrl, getInitials } from "./user-menu-helpers"

/**
 * Session-aware right-side header control (ADR-023).
 *
 * Three render branches keyed off `authClient.useSession()`:
 *   - isPending: Skeleton placeholder (avoids the flash of an
 *     unauthenticated CTA set before the session resolves).
 *   - session is null: Log in + Sign up buttons linking to apps/app.
 *   - session is set: Avatar trigger + DropdownMenu with Dashboard
 *     and Sign out (with a confirmation Dialog, mirroring
 *     apps/app/components/sidebars/nav-user.tsx).
 *
 * The authClient hook is called at the top level of the component,
 * which is a valid React rules-of-hooks context. The repo's
 * `no-restricted-syntax` rule (packages/eslint-config/base.js)
 * bans this call from async callbacks / non-top-level scopes
 * because the underlying signal value would be stale there. The
 * disable directive below restores the top-level call.
 */

function appUrl(path: string, baseUrl: string): string {
	return new URL(path, baseUrl).toString()
}

/**
 * ADR-029: `baseUrl` is resolved server-side by `<UserMenuServer>`
 * (a Server Component) because `withRelatedProject` reads
 * `process.env.VERCEL_RELATED_PROJECTS`, which Vercel only injects
 * at runtime on the server — not in the browser bundle. Passing the
 * resolved URL as a prop lets the Client Component use the
 * preview-aware value without re-reading env at runtime.
 */
export function UserMenu({
  variant,
  baseUrl,
}: {
  variant: "desktop" | "mobile"
  baseUrl: string
}) {
	const authClient = useAuthClient()
	// eslint-disable-next-line no-restricted-syntax
	const { data: session, isPending } = authClient.useSession()
	const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
	const [loggingOut, setLoggingOut] = useState(false)

	if (isPending) {
		return variant === "desktop" ? (
			<div
				data-testid="header-user-menu"
				data-pending="true"
				className="size-8 animate-pulse rounded-full bg-muted"
				aria-hidden="true"
			/>
		) : (
			<div
				data-testid="header-user-menu"
				data-pending="true"
				className="h-9 w-full animate-pulse rounded-md bg-muted"
				aria-hidden="true"
			/>
		)
	}

	if (!session) {
		const loginHref = appUrl("/login", baseUrl)
		const signupHref = appUrl("/signup", baseUrl)
		if (variant === "desktop") {
			return (
				<div data-testid="header-user-menu" className="flex items-center gap-1.5">
					<Button asChild variant="outline">
						<Link href={loginHref}>Log in</Link>
					</Button>
					<Button asChild>
						<Link href={signupHref}>Sign up</Link>
					</Button>
				</div>
			)
		}
		return (
			<div data-testid="header-user-menu" className="mt-auto flex flex-col gap-2">
				<Button asChild variant="outline" className="w-full">
					<Link href={loginHref}>Log in</Link>
				</Button>
				<Button asChild className="w-full">
					<Link href={signupHref}>Sign up</Link>
				</Button>
			</div>
		)
	}

	// Authenticated: render the avatar dropdown.
	const user = session.user
	const avatarUrl = getAvatarUrl(user.email, user.image)
	const initials = getInitials(user.name)
	const dashboardHref = appUrl("/home", baseUrl)

	async function handleLogout() {
		setLoggingOut(true)
		setLogoutDialogOpen(false)
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					// window.location.href (full reload) instead of
					// router.push — the React signal must be cleared
					// and the next paint must show the anonymous
					// CTA set.
					window.location.href = appUrl("/login", baseUrl)
				},
			},
		})
	}

	if (variant === "desktop") {
		return (
			<div data-testid="header-user-menu" data-authenticated="true" className="flex items-center gap-1.5">
				<Button asChild variant="outline" data-testid="header-dashboard-button">
					<Link href={dashboardHref}>Dashboard</Link>
				</Button>
				<DropdownMenu>
					<DropdownMenuTrigger
						className="flex size-8 items-center justify-center rounded-full ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						aria-label="Open user menu"
						data-testid="header-avatar-trigger"
					>
						<Avatar className="size-8">
							<AvatarImage src={avatarUrl} alt={user.name ?? user.email} />
							<AvatarFallback>{initials}</AvatarFallback>
						</Avatar>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" sideOffset={6} className="w-56">
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex flex-col gap-0.5 px-2 py-1.5">
								<span className="truncate text-sm font-medium">
									{user.name ?? user.email}
								</span>
								<span className="truncate text-xs text-muted-foreground">
									{user.email}
								</span>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link href={dashboardHref}>
								<LayoutDashboardIcon />
								Dashboard
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onSelect={(event) => {
								event.preventDefault()
								setLogoutDialogOpen(true)
							}}
							data-testid="header-sign-out"
						>
							<LogOutIcon />
							Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Sign out?</DialogTitle>
							<DialogDescription>
								You will be signed out of your account.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setLogoutDialogOpen(false)}
								disabled={loggingOut}
							>
								Cancel
							</Button>
							<Button onClick={handleLogout} disabled={loggingOut}>
								{loggingOut ? "Signing out…" : "Sign out"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		)
	}

	// Mobile Sheet footer: keep the visual structure simple. The
	// mobile dropdown lives inside the sheet's scrollable area, so
	// we use the same avatar + DropdownMenu but with full-width
	// menu items for tap targets.
	return (
		<div
			data-testid="header-user-menu"
			data-authenticated="true"
			className="mt-auto flex flex-col gap-3"
		>
			<div className="flex items-center gap-3">
				<Avatar className="size-9">
					<AvatarImage src={avatarUrl} alt={user.name ?? user.email} />
					<AvatarFallback>{initials}</AvatarFallback>
				</Avatar>
				<div className="flex min-w-0 flex-col">
					<span className="truncate text-sm font-medium">
						{user.name ?? user.email}
					</span>
					<span className="truncate text-xs text-muted-foreground">
						{user.email}
					</span>
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<Button asChild variant="outline" className="w-full justify-start">
					<Link href={dashboardHref}>
						<LayoutDashboardIcon />
						Dashboard
					</Link>
				</Button>
				<Button
					variant="outline"
					className="w-full justify-start"
					onClick={() => setLogoutDialogOpen(true)}
					disabled={loggingOut}
				>
					<LogOutIcon />
					Sign out
				</Button>
			</div>

			<Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Sign out?</DialogTitle>
						<DialogDescription>
							You will be signed out of your account.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setLogoutDialogOpen(false)}
							disabled={loggingOut}
						>
							Cancel
						</Button>
						<Button onClick={handleLogout} disabled={loggingOut}>
							{loggingOut ? "Signing out…" : "Sign out"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
