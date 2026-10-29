import { hasManagingRole } from "@workspace/auth/organization/roles"

import { OrganizationProjectsPage } from "@/components/organizations/projects/organization-projects-page"
import { readWorkspaceOrganization } from "@/lib/workspace-organization"

export default async function OrganizationProjectsRoute({
  params,
}: {
  params: Promise<{ organization_slug: string }>
}) {
  const { organization_slug } = await params
  const organization = await readWorkspaceOrganization(organization_slug)

  return (
    <OrganizationProjectsPage
      organizationSlug={organization_slug}
      organizationName={organization.name}
      canManage={hasManagingRole(organization.role)}
      projects={[]}
    />
  )
}
