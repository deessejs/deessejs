/**
 * Per-organization profile and eligible-deletion pane.
 *
 * The page renders the current organization name, an inline rename
 * form (owner + admin only), and a destructive zone (owner only)
 * with a confirmation dialog that requires the user to type the
 * organization's display name before the delete button arms.
 *
 * The rename form posts to `renameOrganization` (a Server Action
 * colocated with this page). The destructive zone posts to
 * `deleteOrganization` (a Server Action that wraps the better-auth
 * plugin's `deleteOrganization` after re-checking the
 * `beforeDeleteOrganization` invariant server-side).
 *
 * RFC-001 §7 "Destructive actions must require role checks AND
 * a typed confirmation": this page implements both.
 */
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@workspace/auth"
import {
	hasAdminOrOwnerRole,
	hasOwnerRole,
} from "@workspace/auth/organization-policy"
import { getMembership } from "@workspace/auth/organization-policy"
import { requireAccountSession } from "@/lib/organization-auth"
import { OrganizationProfileForm } from "@/components/settings/organization-profile-form"
import { DeleteOrganizationZone } from "@/components/settings/delete-organization-zone"

interface OrganizationProfilePageProps {
	params: Promise<{ organization_slug: string }>
}

export default async function OrganizationProfilePage({
	params,
}: OrganizationProfilePageProps) {
	const { organization_slug } = await params
	const session = await requireAccountSession()
	const membership = await getMembership(session.user.id, organization_slug)
	if (!membership) notFound()

	const orgs = await auth.api.listOrganizations({
		headers: await headers(),
	})
	const org = (orgs as Array<{ id: string; name: string; slug: string }>).find(
		(o) => o.id === membership.organizationId,
	)
	if (!org) notFound()

	const isOwner = hasOwnerRole(membership.role)
	const canRename = hasAdminOrOwnerRole(membership.role)

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold tracking-tight">
					Organization profile
				</h1>
				<p className="text-sm text-muted-foreground">
					Edit the display name and (for owners) manage the
					destructive actions.
				</p>
			</header>

			<OrganizationProfileForm
				organizationId={org.id}
				initialName={org.name}
				canEdit={canRename}
			/>

			{isOwner ? (
				<DeleteOrganizationZone
					organizationSlug={organization_slug}
					organizationName={org.name}
				/>
			) : null}
		</div>
	)
}
