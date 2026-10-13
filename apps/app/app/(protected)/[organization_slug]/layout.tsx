import { notFound } from "next/navigation"
import { SidebarProvider } from "@workspace/ui/components/sidebar"
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
	await requireCompletedOnboarding()
	// Second guard: account must be a member of the requested
	// organization. Redirects to the account default home on miss.
	await requireOrganizationAccess(organization_slug, "read")

	return (
		<SidebarProvider>
			<div className="flex min-h-dvh">
				<AppSidebar organizationSlug={organization_slug} />
				<main className="flex-1 p-6">{children}</main>
			</div>
		</SidebarProvider>
	)
}
