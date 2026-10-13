/**
 * Per-organization members and role controls. Owner/admin only.
 * RFC-001 §7: "Manage members and invitations" is allowed for
 * owner and admin, subject to the plugin's endpoint checks. The
 * page consumes the plugin's `listMembers` and the role-mutation
 * methods through Server Actions.
 */
import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@workspace/auth"
import {
	hasAdminOrOwnerRole,
	hasOwnerRole,
	getMembership,
} from "@workspace/auth/organization-policy"
import { requireAccountSession } from "@/lib/organization-auth"
import { MembersTable } from "@/components/settings/members-table"

interface OrganizationMembersPageProps {
	params: Promise<{ organization_slug: string }>
}

export default async function OrganizationMembersPage({
	params,
}: OrganizationMembersPageProps) {
	const { organization_slug } = await params
	const session = await requireAccountSession()
	const membership = await getMembership(session.user.id, organization_slug)
	if (!membership) notFound()
	if (!hasAdminOrOwnerRole(membership.role)) {
		// Non-admins are not allowed to see the member list at this
		// level. Bounce to the org home.
		redirect(`/${organization_slug}/home`)
	}

	const list = await auth.api.listMembers({
		query: { organizationId: membership.organizationId },
		headers: await headers(),
	})
	const rows = (list as {
		members: Array<{
			id: string
			userId: string
			role: string
			createdAt: Date | string
			user: { name: string; email: string } | null
		}>
	}) ?? { members: [] }

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold tracking-tight">Members</h1>
				<p className="text-sm text-muted-foreground">
					Manage roles and remove members. Only owners can demote
					or remove other owners.
				</p>
			</header>
			<MembersTable
				organizationId={membership.organizationId}
				organizationSlug={organization_slug}
				canManageAll={hasOwnerRole(membership.role)}
				currentUserId={session.user.id}
				members={rows.members.map((m) => ({
					id: m.id,
					userId: m.userId,
					role: m.role,
					createdAt:
						typeof m.createdAt === "string"
							? m.createdAt
							: m.createdAt.toISOString(),
					name: m.user?.name ?? "—",
					email: m.user?.email ?? "—",
				}))}
			/>
		</div>
	)
}
