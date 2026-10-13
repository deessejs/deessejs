/**
 * Per-organization invitation management. Lists pending invitations
 * with revoke / resend actions, surfaces delivery failures from the
 * `sendOrganizationInvitation` helper (RFC-001 §9).
 */
export default async function OrganizationInvitationsPage() {
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
		</div>
	)
}
