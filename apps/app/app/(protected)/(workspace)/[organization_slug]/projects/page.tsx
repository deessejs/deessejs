import { hasManagingRole } from "@workspace/auth/organization/roles"

import { OrganizationProjectsPage } from "@/components/organizations/projects/organization-projects-page"
import { orpc } from "@/lib/orpc"
import { readWorkspaceOrganization } from "@/lib/workspace-organization"

export default async function OrganizationProjectsRoute({
  params,
}: {
  params: Promise<{ organization_slug: string }>
}) {
  const { organization_slug } = await params
  const [organization, projects] = await Promise.all([
    readWorkspaceOrganization(organization_slug),
    orpc.githubApp.projects
      .list({ slug: organization_slug })
      .then((result) => result.projects)
      .catch(() => null),
  ])

  return (
    <OrganizationProjectsPage
      organizationSlug={organization_slug}
      organizationName={organization.name}
      canManage={hasManagingRole(organization.role)}
      projects={projects}
    />
  )
}
