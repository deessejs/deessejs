import { OrganizationProjectImportPage } from "@/components/organizations/projects/organization-project-import-page"
import { orpc } from "@/lib/orpc"
import { readWorkspaceOrganization } from "@/lib/workspace-organization"

export default async function OrganizationProjectImportRoute({
  params,
}: {
  params: Promise<{ organization_slug: string }>
}) {
  const { organization_slug } = await params
  const [organization, githubStatus] = await Promise.all([
    readWorkspaceOrganization(organization_slug),
    orpc.githubApp.status({ slug: organization_slug }).catch(() => null),
  ])

  return (
    <OrganizationProjectImportPage
      organizationSlug={organization_slug}
      organizationName={organization.name}
      installation={githubStatus?.installation ?? null}
      githubStatusUnavailable={githubStatus === null}
    />
  )
}
