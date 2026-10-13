"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronsUpDown, PlusIcon } from "lucide-react"

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Button } from "@workspace/ui/components/button"
import { authClient } from "@/lib/auth-client"
import { CreateOrganizationDialog } from "@/components/sidebars/create-organization-dialog"
import { useState } from "react"

interface AppSidebarProps {
	organizationSlug: string
	memberships: Array<{ id: string; slug: string; name: string }>
}

/**
 * Application sidebar. RFC-001 §8: the workspace chrome is a
 * shadcn `Sidebar` with three zones — the organization switcher in
 * the header, the home link + organization settings access in the
 * content, and the account menu (linking to /account/settings) plus
 * logout in the footer. The header sits inside the sidebar (not the
 * page header), so the top of the page is reserved for content.
 *
 * The `OrganizationSwitcher` is a `DropdownMenu` listing the
 * server-rendered memberships; the "Create organization" action
 * opens a `Dialog` (Q15). Mobile surfaces inherit the shadcn
 * `Sidebar` built-in mobile drawer.
 */
export function AppSidebar({
	organizationSlug,
	memberships,
}: AppSidebarProps) {
	const router = useRouter()
	const pathname = usePathname()
	const [createOpen, setCreateOpen] = useState(false)

	return (
		<Sidebar>
			<SidebarHeader>
				<OrganizationSwitcher
					activeSlug={organizationSlug}
					memberships={memberships}
					onCreateClick={() => setCreateOpen(true)}
					onSelect={(slug) => router.push(`/${slug}/home`)}
				/>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Workspace</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={pathname === `/${organizationSlug}/home`}
								>
									<Link href={`/${organizationSlug}/home`}>Home</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={pathname.startsWith(
										`/${organizationSlug}/settings/organization`,
									)}
								>
									<Link href={`/${organizationSlug}/settings/organization`}>
										Organization
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={pathname.startsWith(
										`/${organizationSlug}/settings/members`,
									)}
								>
									<Link href={`/${organizationSlug}/settings/members`}>
										Members
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={pathname.startsWith(
										`/${organizationSlug}/settings/invitations`,
									)}
								>
									<Link href={`/${organizationSlug}/settings/invitations`}>
										Invitations
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupLabel>Account</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link href="/account/settings/profile">Profile</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link href="/account/settings/sessions">Sessions</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link href="/account/settings/connections">Connections</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<AccountMenuFooter />
			</SidebarFooter>

			<CreateOrganizationDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				onCreated={(slug) => router.push(`/${slug}/home`)}
			/>
		</Sidebar>
	)
}

/**
 * Organization switcher — `DropdownMenu` in `SidebarHeader`. Lists
 * the current memberships and offers a "Create organization" entry
 * (Q15). On selection, calls `onSelect(slug)`. The selected
 * organization is highlighted.
 */
function OrganizationSwitcher({
	activeSlug,
	memberships,
	onSelect,
	onCreateClick,
}: {
	activeSlug: string
	memberships: Array<{ id: string; slug: string; name: string }>
	onSelect: (slug: string) => void
	onCreateClick: () => void
}) {
	const active = memberships.find((m) => m.slug === activeSlug) ?? {
		slug: activeSlug,
		name: activeSlug,
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="w-full justify-between"
					aria-label="Switch organization"
				>
					<span className="truncate font-medium">{active.name}</span>
					<ChevronsUpDown className="size-4 shrink-0 opacity-60" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-64">
				<DropdownMenuLabel>Organizations</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{memberships.length === 0 ? (
					<DropdownMenuItem disabled>No organizations yet</DropdownMenuItem>
				) : (
					memberships.map((m) => (
						<DropdownMenuItem
							key={m.id}
							onClick={() => onSelect(m.slug)}
							aria-current={m.slug === activeSlug ? "true" : undefined}
						>
							{m.name}
						</DropdownMenuItem>
					))
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={onCreateClick}>
					<PlusIcon />
					Create organization
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

/**
 * Account menu in the footer. Links to /account/settings and offers
 * logout. Mirrors the `NavUser` flow that previously lived in the
 * page header.
 */
function AccountMenuFooter() {
	const router = useRouter()
	const { data: session } = authClient.useSession()
	const user = session?.user

	async function handleLogout() {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => router.push("/login"),
			},
		})
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="w-full justify-start">
					{user?.name ?? user?.email ?? "Account"}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" sideOffset={4} className="w-56">
				<DropdownMenuItem onClick={() => router.push("/account/settings/profile")}>
					Profile
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => router.push("/account/settings/sessions")}>
					Sessions
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
