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
import { OrganizationProfile } from "@/components/settings/organization-profile"

/**
 * The organization's general page.
 *
 * The page belongs to the organization in its URL, and the layout
 * above it has already resolved the access: a caller who does not
 * belong to the organization got the not-found page and never reached
 * this one. The page does not authorize.
 *
 * Members can read the profile. Better Auth and the organization
 * update hook authorize and validate edits for owners and admins.
 */
export default async function OrganizationSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ organization_slug: string }>
  searchParams: Promise<{ githubApp?: string }>
}) {
  const [{ organization_slug }, query] = await Promise.all([
    params,
    searchParams,
  ])
  const [organization, githubAppStatus] = await Promise.all([
    readWorkspaceOrganization(organization_slug),
    orpc.githubApp.status({ slug: organization_slug }),
  ])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-2 border-b pb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Organization settings</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {organization.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage this organization&apos;s display name and logo. The workspace
          address and identifier stay fixed.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Organization profile</CardTitle>
          <CardDescription>
            Manage the display name and logo for this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationProfile organization={organization} />
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
