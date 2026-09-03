"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { toast } from "sonner"
import { APP_NAME } from "@/lib/app-config"

/**
 * Public/unprotected header. Renders anonymously when the user is
 * not signed in (Login / Sign up buttons) and reveals the avatar
 * menu when a session is active. Same component everywhere,
 * adapts on its own.
 */
export function SiteHeader() {
	const router = useRouter()
	const { data: session } = authClient.useSession()

	const user = session?.user
	const initials = user
		? (user.name ?? user.email ?? "U")
				.split(/\s+/)
				.map((part) => part[0])
				.filter(Boolean)
				.slice(0, 2)
				.join("")
				.toUpperCase()
		: ""

	async function handleSignOut() {
		const { error } = await authClient.signOut()
		if (error) {
			toast.error(error.message ?? "Could not sign out")
			return
		}
		router.push("/login")
	}

	return (
		<header className="border-b">
			<div className="mx-auto flex h-14 items-center justify-between px-4">
				<Link href="/" className="font-semibold text-lg">
					{APP_NAME}
				</Link>

				<nav className="flex items-center gap-2">
					{user ? (
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<button
										type="button"
										className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										aria-label="Open user menu"
									>
										<Avatar className="size-8">
											{user.image ? (
												<AvatarImage src={user.image} alt={user.name ?? ""} />
											) : null}
											<AvatarFallback>{initials || "U"}</AvatarFallback>
										</Avatar>
									</button>
								}
							/>
							<DropdownMenuContent align="end" className="w-56">
								<div className="flex flex-col gap-0.5 px-2 py-1.5">
									{user.name ? (
										<span className="text-sm font-medium">{user.name}</span>
									) : null}
									{user.email ? (
										<span className="text-xs text-muted-foreground">
											{user.email}
										</span>
									) : null}
								</div>
								<DropdownMenuSeparator />
								<DropdownMenuItem render={<Link href="/home" />}>
									Dashboard
								</DropdownMenuItem>
								<DropdownMenuItem render={<Link href="/settings/profile" />}>
									Settings
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => {
										void handleSignOut()
									}}
									variant="destructive"
								>
									Sign out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<>
							<Button variant="outline" asChild>
								<Link href="/login">Login</Link>
							</Button>
							<Button asChild>
								<Link href="/signup">Sign up</Link>
							</Button>
						</>
					)}
				</nav>
			</div>
		</header>
	)
}