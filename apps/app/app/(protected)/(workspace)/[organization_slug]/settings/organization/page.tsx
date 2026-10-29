import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { readWorkspaceOrganization } from "@/lib/workspace-organization"
import { orpc } from "@/lib/orpc"
import { GitHubAppIntegration } from "@/components/settings/github-app-integration"

/**
 * The organization's general page.
 *
 * The page belongs to the organization in its URL, and the layout
 * above it has already resolved the access: a caller who does not
 * belong to the organization got the not-found page and never reached
 * this one. The page does not authorize.
 *
 * The view is read-only, and it says so. Editing the profile arrives
 * with the organization management, and the route does not change when
 * it lands, so the navigation stays the same.
 */
export default async function OrganizationSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ organization_slug: string }>
  searchParams: Promise<{ githubApp?: string }>
}) {
  const [{ organization_slug }, query] = await Promise.all([params, searchParams])
  const [organization, githubAppStatus] = await Promise.all([
    readWorkspaceOrganization(organization_slug),
    orpc.githubApp.status({ slug: organization_slug }),
  ])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {organization.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          How this organization is identified. The name and the role are yours
          to change, the address and the identifier are the server&apos;s.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            These details are read-only for now. Editing them arrives with the
            organization management.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">Address</dt>
              <dd className="text-sm font-medium">/{organization.slug}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">Identifier</dt>
              <dd className="break-all font-mono text-xs">
                {organization.id}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">Your role</dt>
              <dd className="text-sm font-medium">{organization.role}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <GitHubAppIntegration
        slug={organization_slug}
        status={githubAppStatus}
        result={query.githubApp}
      />
    </div>
  )
}
