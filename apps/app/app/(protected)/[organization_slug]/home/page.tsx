/**
 * Per-organization home page. Vercel-style `/[organization_slug]/home`
 * (RFC-001 §8). The dashboard initially contains only a simple
 * welcome card; product dashboards, project lists, and analytics are
 * deliberately out of scope.
 */
export default async function OrganizationHomePage() {
	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold tracking-tight">Home</h1>
				<p className="text-sm text-muted-foreground">
					You&apos;re in. This is your organization workspace.
				</p>
			</header>
		</div>
	)
}
