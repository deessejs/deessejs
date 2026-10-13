/**
 * Per-organization invitation management. Lists pending invitations
 * with revoke actions, and surfaces a form to send a new
 * invitation. The form posts to a Server Action that calls
 * `auth.api.createInvitation`, which the plugin routes to the
 * `sendInvitationEmail` callback (wired to
 * `sendOrganizationInvitation` in
 * `packages/auth/src/organization-invitation.ts`).
 *
 * RFC-001 §9: the invitation acceptance URL is built from
 * `serverEnv.APP_URL` (NOT the request host, NOT a forwarded
 * header). The helper validates the URL is origin-only and uses
 * HTTPS outside localhost.
 *
 * The page is owner/admin only at the layout level via
 * `requireOrganizationAccess(slug, "admin")`; non-admin members
 * who hit the URL see the layout's redirect to the org home.
 */
import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@workspace/auth"
import {
	hasAdminOrOwnerRole,
	getMembership,
} from "@workspace/auth/organization-policy"
import { requireAccountSession } from "@/lib/organization-auth"
import { InvitationsManager } from "@/components/settings/invitations-manager"

interface OrganizationInvitationsPageProps {
	params: Promise<{ organization_slug: string }>
}

export default async function OrganizationInvitationsPage({
	params,
}: OrganizationInvitationsPageProps) {
	const { organization_slug } = await params
	const session = await requireAccountSession()
	const membership = await getMembership(session.user.id, organization_slug)
	if (!membership) notFound()
	if (!hasAdminOrOwnerRole(membership.role)) {
		// Not authorized to manage invitations. Bounce to the
		// org home; the layout would have allowed the read but
		// the page requires the admin role.
		redirect(`/${organization_slug}/home`)
	}

	const invitations = await auth.api.listInvitations({
		query: { organizationId: membership.organizationId },
		headers: await headers(),
	})
	const list = (invitations as Array<{
		id: string
		email: string
		role: string | null
		status: string
		expiresAt: Date | string
	}>) ?? []

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold tracking-tight">
					Invitations
				</h1>
				<p className="text-sm text-muted-foreground">
					Pending invitations sent from this organization.
				</p>
			</header>
			<InvitationsManager
				organizationId={membership.organizationId}
				organizationSlug={organization_slug}
				initialInvitations={list.map((i) => ({
					id: i.id,
					email: i.email,
					role: i.role ?? "member",
					status: i.status,
					expiresAt:
						typeof i.expiresAt === "string"
							? i.expiresAt
							: i.expiresAt.toISOString(),
				}))}
			/>
		</div>
	)
}
