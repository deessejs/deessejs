/**
 * Per-organization profile and eligible deletion pane. The page
 * itself is a placeholder for the scaffolding step; the
 * implementation branch wires the form to the plugin's
 * `authClient.organization.update` (display name) and
 * `authClient.organization.delete` (owner-only, after the
 * confirmation dialog names the organization).
 *
 * The destructive zone is owner-only per RFC-001 §7. The plugin's
 * `beforeDeleteOrganization` hook enforces protection against the
 * account's default organization at the server level.
 */
export default async function OrganizationProfilePage() {
	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold tracking-tight">
					Organization profile
				</h1>
				<p className="text-sm text-muted-foreground">
					Edit the display name, manage the logo, and (for owners)
					delete the organization.
				</p>
			</header>
		</div>
	)
}
