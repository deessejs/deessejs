"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
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
import { authClient } from "@/lib/auth-client"
import { orgHomePath } from "@/lib/org-route"

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean)
	if (parts.length === 0) return "?"
	if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
	return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

/**
 * Workspace switcher in the sidebar header.
 *
 * Pattern from shadcn/ui sidebar-07 and the better-auth
 * organizationClient plugin. Both the org list and the active org
 * come from atoms under the hood (`useListOrganizations` and
 * `useActiveOrganization`); switching calls `setActiveOrganization`
 * which re-emits the session cookie and bumps the active-org
 * signal atom so every consumer re-renders.
 *
 * The Create dialog hands the new org over to better-auth and
 * invalidates the orgs query so the switcher picks it up
 * automatically.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ac = authClient as any

export function TeamSwitcher() {
	const router = useRouter()
	const queryClient = useQueryClient()
	const { isMobile } = useSidebar()
	const [createOpen, setCreateOpen] = useState(false)

	const { data: orgsData } = ac.useListOrganizations()
	const { data: activeData } = ac.useActiveOrganization()

	type Org = { id: string; name: string; slug: string; logo?: string | null }
	type OrgWithRole = Org & { role: string }

	const orgs: OrgWithRole[] = ((orgsData ?? []) as Org[])
		.map((org) => {
			// `organization` items in the list response don't carry
			// the role directly — better-auth returns memberships
			// separately. We surface the org with a separate
			// membership lookup omitted for V1 (role badge on the
			// trigger stays hidden until the membership array is
			// wired in PR #6).
			const membership = (activeData?.members ?? []).find(
				(m: { organizationId: string; role: string }) =>
					m.organizationId === org.id,
			)
			return { ...org, role: membership?.role ?? "owner" }
		})

	const activeOrg: OrgWithRole | undefined =
		orgs.find((o) => o.id === activeData?.id) ?? orgs[0]

	async function switchToOrg(orgId: string) {
		const next = orgs.find((o) => o.id === orgId)
		if (!next) return
		await ac.organization.setActiveOrganization({ organizationId: orgId })
		queryClient.invalidateQueries({ queryKey: ["organization"] })
		router.push(orgHomePath(next.slug))
	}

	async function handleCreated(values: { name: string; slug: string }) {
		await ac.organization.createOrganization({
			name: values.name,
			slug: values.slug,
		})
		await queryClient.invalidateQueries({ queryKey: ["organization"] })
		setCreateOpen(false)
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
								{activeOrg?.logo ? (
									<AvatarImage
										src={activeOrg.logo}
										alt={activeOrg.name}
									/>
								) : null}
								<AvatarFallback className="rounded-lg">
									{activeOrg ? getInitials(activeOrg.name) : "?"}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="flex items-center gap-1 truncate font-medium">
									{activeOrg?.name ?? "No workspace"}
								</span>
								<span className="truncate text-xs capitalize text-muted-foreground">
									{activeOrg?.role ?? "owner"}
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
							value={activeOrg?.id ?? ""}
							onValueChange={(value) => {
								switchToOrg(value)?.catch(() => {})
							}}
						>
							{orgs.map((org) => (
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
									{org.id === activeOrg?.id ? (
										<Check className="size-4 text-primary" />
									) : null}
								</DropdownMenuRadioItem>
							))}
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
									Better-auth — ADR-030
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