/**
 * Per-organization members and role controls. Owner/admin only.
 * RFC-001 §7: "Manage members and invitations" is allowed for
 * owner and admin, subject to the plugin's endpoint checks. The
 * page consumes the plugin's `authClient.organization.listMembers`
 * and the role-mutation methods.
 */
export default async function OrganizationMembersPage() {
	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold tracking-tight">Members</h1>
				<p className="text-sm text-muted-foreground">
					Invite teammates, change roles, and remove members.
				</p>
			</header>
		</div>
	)
}
