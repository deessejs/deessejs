"use client"

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
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@workspace/ui/components/sidebar"

import { orgHomePath, ORG_SLUG } from "@/lib/org-route"

type Organization = {
	id: string
	slug: string
	name: string
	logo?: string | null
	role: "owner" | "admin" | "member"
}

/**
 * Dummy organizations list.
 *
 * ADR-030 §"Decision #5" + sidebar-07 pattern. The first entry is
 * the dummy "Acme Corp" workspace; the second is a placeholder
 * so the radio-group has a second option to switch to visually.
 * PR #4 will replace this with `auth.api.listOrganizations()`.
 */
const DUMMY_ORGS: Organization[] = [
	{ id: "org_acme", slug: ORG_SLUG, name: "Acme Corp", role: "owner" },
	{ id: "org_personal", slug: "personal", name: "Personal", role: "owner" },
]

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean)
	if (parts.length === 0) return "?"
	if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
	return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export function TeamSwitcher() {
	const router = useRouter()
	const { isMobile } = useSidebar()
	// Dummy: "Acme Corp" is the active workspace.
	const activeOrg = DUMMY_ORGS[0]!

	function switchToOrg(org: Organization) {
		// Dummy backend. PR #4 will call `authClient.organization.setActiveOrganization(...)`
		// and route to `/${org.slug}/home`. For now we route via the
		// URL — only the dummy "acme" slug resolves to a real route.
		router.push(orgHomePath(org.slug))
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
							onValueChange={(value) => {
								const next = DUMMY_ORGS.find((org) => org.id === value)
								if (next) switchToOrg(next)
							}}
						>
							{DUMMY_ORGS.map((org, index) => (
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
									{index === 0 ? (
										<DropdownMenuShortcut>
											<Check className="size-4" />
										</DropdownMenuShortcut>
									) : null}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem disabled className="gap-2 p-2">
							<div className="flex size-6 items-center justify-center rounded-md border bg-background">
								<Plus className="size-4" />
							</div>
							<div className="flex flex-1 flex-col text-left text-sm leading-tight">
								<span className="font-medium">Create organization</span>
								<span className="truncate text-xs text-muted-foreground">
									Dummy — ADR-030 PR #4
								</span>
							</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}