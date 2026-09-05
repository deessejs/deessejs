import { headers } from "next/headers"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar"

import { APP_NAME } from "@/lib/app-config"
import { AppSidebar } from "@/components/sidebars/app-sidebar"
import { Separator } from "@workspace/ui/components/separator"
import {
	ActiveOrgProvider,
	type ActiveOrg,
} from "@/components/providers/active-org-provider"
import { requireCompleteSession } from "@/lib/require-complete-session"
import { auth } from "@workspace/auth"

type Props = {
	children: React.ReactNode
}

export default async function ProtectedLayout({ children }: Props) {
	// ADR-031: defense-in-depth gate. The proxy already enforces the
	// four invariants at the edge; this Server-Component call makes
	// sure every protected page is gated regardless of any future
	// matcher change.
	await requireCompleteSession()

	const headerStore = await headers()
	const pathname = headerStore.get("x-pathname") ?? ""

	// Resolve the active org from the session cookie + the org
	// list. better-auth 1.7.2 does not expose getActiveOrganization
	// on the server api surface — the active-org id lives on the
	// session row and the org shape on the organization table. We
	// pick the active entry out of the membership list rather than
	// running a second query. The result flows down through the
	// Provider keyed by pathname so the sidebar re-mounts (and
	// re-reads) on every navigation — no useEffect, no atom cache
	// to invalidate.
	const session = await auth.api
		.getSession({ headers: headerStore })
		.catch(() => null)
	const activeOrgId = session?.session?.activeOrganizationId ?? null

	let initialActiveOrg: ActiveOrg | null = null
	if (activeOrgId) {
		const orgs = (await auth.api
			.listOrganizations({ headers: headerStore })
			.catch(() => [])) as Array<{
			id: string
			name: string
			slug?: string
			logo?: string | null
		}>
		const match = orgs.find((org) => org.id === activeOrgId)
		if (match) {
			initialActiveOrg = {
				id: match.id,
				slug: match.slug ?? "",
				name: match.name,
				role: "owner",
				...(match.logo ? { logo: match.logo } : {}),
			}
		}
	}

	return (
		// key={pathname} forces the Provider subtree to remount on
		// every navigation. State inside Client Components
		// (TeamSwitcher dropdowns, etc.) resets and re-reads the
		// fresh active org from the new Provider value.
		<ActiveOrgProvider
			key={pathname}
			initialActiveOrg={initialActiveOrg}
		>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset>
					<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
						<SidebarTrigger />
						<Separator orientation="vertical" className="mr-2 h-4" />
						<h1 className="text-sm font-medium">{APP_NAME}</h1>
					</header>
					<main className="p-6">{children}</main>
				</SidebarInset>
			</SidebarProvider>
		</ActiveOrgProvider>
	)
}
