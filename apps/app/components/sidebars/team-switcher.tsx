"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@workspace/ui/components/sidebar"

import { CreateOrganizationDialog } from "@/components/sidebars/create-organization-dialog"
import { orgHomePath, ORG_SLUG } from "@/lib/org-route"
import { getAvatarUrl } from "@/lib/avatar"

type Organization = {
	id: string
	slug: string
	name: string
	logo?: string | null
	role: "owner" | "admin" | "member"
}

/**
 * Dummy seed. ADR-030 PR #4 will replace this with
 * `auth.api.listOrganizations()`. Each seed entry ships with a
 * stable Vercel-CDN avatar URL keyed off its id so the switcher
 * doesn't need per-org image storage during the dummy phase.
 */
const SEED_ORGS: Organization[] = [
	{
		id: "org_acme",
		slug: ORG_SLUG,
		name: "Acme Corp",
		role: "owner",
		logo: getAvatarUrl("org_acme", { size: 64 }),
	},
	{
		id: "org_personal",
		slug: "personal",
		name: "Personal",
		role: "owner",
		logo: getAvatarUrl("org_personal", { size: 64 }),
	},
]

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean)
	if (parts.length === 0) return "?"
	if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
	return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

/**
 * Workspace switcher in the sidebar header.
 *
 * Pattern from shadcn/ui sidebar-07. The component owns two local
 * pieces of state so the dummy stays interactive:
 *   - `orgs` is the live list (the user can add a new one through
 *     the Create dialog).
 *   - `activeOrgId` tracks the currently-selected workspace and
 *     drives the switcher trigger label plus the checkmark in the
 *     radio group.
 *
 * Both are in-memory and reset on reload — PR #4 swaps them for
 * better-auth calls (`listOrganizations` + `setActiveOrganization`).
 */
export function TeamSwitcher() {
	const router = useRouter()
	const { isMobile } = useSidebar()
	const [orgs, setOrgs] = useState<Organization[]>(SEED_ORGS)
	const [activeOrgId, setActiveOrgId] = useState<string>(SEED_ORGS[0]!.id)
	const [createOpen, setCreateOpen] = useState(false)

	const activeOrg = orgs.find((org) => org.id === activeOrgId) ?? orgs[0]!

	function switchToOrg(orgId: string) {
		const next = orgs.find((org) => org.id === orgId)
		if (!next) return
		setActiveOrgId(next.id)
		router.push(orgHomePath(next.slug))
	}

	function handleCreated(org: { id: string; slug: string; name: string }) {
		setOrgs((current) => [
			...current,
			{ ...org, role: "owner" },
		])
		switchToOrg(org.id)
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="size-8 rounded-lg">
								{activeOrg.logo ? (
									<AvatarImage src={activeOrg.logo} alt={activeOrg.name} />
								) : null}
								<AvatarFallback className="rounded-lg">
									{getInitials(activeOrg.name)}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="flex items-center gap-1 truncate font-medium">
									{activeOrg.name}
								</span>
								<span className="truncate text-xs capitalize text-muted-foreground">
									{activeOrg.role}
								</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="text-xs text-muted-foreground">
							Workspaces
						</DropdownMenuLabel>
						<DropdownMenuRadioGroup
							value={activeOrg.id}
							onValueChange={(value) => switchToOrg(value)}
						>
							{orgs.map((org) => {
								const isActive = org.id === activeOrg.id
								return (
									<DropdownMenuRadioItem
										key={org.id}
										value={org.id}
										className="gap-2 p-2"
									>
										<Avatar className="size-6 rounded-md">
											{org.logo ? (
												<AvatarImage src={org.logo} alt={org.name} />
											) : null}
											<AvatarFallback className="rounded-md text-xs">
												{getInitials(org.name)}
											</AvatarFallback>
										</Avatar>
										<span className="flex-1 truncate">{org.name}</span>
										{isActive ? (
											<Check className="size-4 text-primary" />
										) : null}
									</DropdownMenuRadioItem>
								)
							})}
						</DropdownMenuRadioGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="gap-2 p-2"
							onSelect={(event) => {
								event.preventDefault()
								setCreateOpen(true)
							}}
						>
							<div className="flex size-6 items-center justify-center rounded-md border bg-background">
								<Plus className="size-4" />
							</div>
							<div className="flex flex-1 flex-col text-left text-sm leading-tight">
								<span className="font-medium">Create organization</span>
								<span className="truncate text-xs text-muted-foreground">
									Dummy — lands in ADR-030 PR #4
								</span>
							</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>

			<CreateOrganizationDialog
				open={createOpen}
				onOpenChange={async (next) => {
					setCreateOpen(next)
				}}
				onCreated={handleCreated}
			/>
		</SidebarMenu>
	)
}