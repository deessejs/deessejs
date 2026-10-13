import { notFound } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar"
import { listUserMemberships } from "@workspace/auth/organization-policy"
import { AppSidebar } from "@/components/sidebars/app-sidebar"
import {
	requireCompletedOnboarding,
	requireOrganizationAccess,
} from "@/lib/organization-auth"

interface OrganizationLayoutProps {
	children: React.ReactNode
	params: Promise<{ organization_slug: string }>
}

/**
 * Per-organization layout. Invokes the authoritative guards
 * (`requireCompletedOnboarding` + `requireOrganizationAccess`)
 * before mounting the sidebar so the page-level Server Component
 * can assume the user is a member of the requested organization.
 *
 * RFC-001 §10 "Authoritative guard placement": layout checks alone
 * are insufficient because layouts can persist across navigation;
 * every page, Server Action, Route Handler and data-access
 * operation must also invoke the appropriate helper. The layout
 * check exists to fail fast and to render the sidebar in the
 * correct organization context.
 *
 * The layout server-renders the user's memberships and passes
 * them to the sidebar. The sidebar's switcher hydrates from
 * the prop instead of issuing a client roundtrip on every
 * mount; selection mutates the active org through the plugin
 * client and the layout re-fetches on the next navigation.
 *
 * The layout wraps the chrome in `SidebarProvider` (from the
 * shadcn `Sidebar` component family) so the `Sidebar`,
 * `SidebarHeader`, `SidebarContent`, and `SidebarFooter` inside
 * `AppSidebar` share the same collapsible / mobile state.
 * Without the provider the shadcn sidebar primitives throw on
 * missing context. The provider is local to the org-scoped
 * layout so the public / unauthenticated surfaces (login,
 * signup, forgot-password) do not pay for the chrome.
 */
export default async function OrganizationLayout({
	children,
	params,
}: OrganizationLayoutProps) {
	const { organization_slug } = await params
	// First guard: account must be signed in, verified, and have
	// completed onboarding. Redirects to onboarding or verify-email
	// when those preconditions fail.
	const session = await requireCompletedOnboarding()
	// Second guard: account must be a member of the requested
	// organization. Redirects to the account default home on miss.
	await requireOrganizationAccess(organization_slug, "read")
	// Server-render the memberships for the sidebar switcher.
	const memberships = await listUserMemberships(session.user.id)

	return (
		<SidebarProvider>
			<div className="flex min-h-dvh">
				<AppSidebar
					organizationSlug={organization_slug}
					memberships={memberships}
				/>
				<div className="flex flex-1 flex-col">
					{/*
					 * Mobile trigger. The shadcn Sidebar starts
					 * closed on small viewports; the trigger is
					 * the only way to open the chrome (and reach
					 * the organization switcher + nav links).
					 * Desktop users see the same button as a
					 * collapse control; the shadcn primitive
					 * renders it inline.
					 */}
					<header className="flex h-12 items-center border-b px-4 md:h-0 md:border-0 md:p-0">
						<SidebarTrigger aria-label="Toggle navigation" />
					</header>
					<main className="flex-1 p-6">{children}</main>
				</div>
			</div>
		</SidebarProvider>
	)
}
