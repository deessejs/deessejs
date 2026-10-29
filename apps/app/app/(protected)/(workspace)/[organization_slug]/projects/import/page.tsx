import { hasManagingRole } from "@workspace/auth/organization/roles"

import { OrganizationProjectImportPage } from "@/components/organizations/projects/organization-project-import-page"
import { orpc } from "@/lib/orpc"
import { readWorkspaceOrganization } from "@/lib/workspace-organization"

export default async function OrganizationProjectImportRoute({
  params,
}: {
  params: Promise<{ organization_slug: string }>
}) {
  const { organization_slug } = await params
  const organization = await readWorkspaceOrganization(organization_slug)
  const canManage = hasManagingRole(organization.role)
  const githubStatusResult = canManage
    ? await orpc.githubApp
        .status({ slug: organization_slug })
        .then((status) => ({ status, unavailable: false }))
        .catch(() => ({ status: null, unavailable: true }))
    : { status: null, unavailable: false }

  return (
    <OrganizationProjectImportPage
      organizationSlug={organization_slug}
      organizationName={organization.name}
      canManage={canManage}
      installation={githubStatusResult.status?.installation ?? null}
      githubStatusUnavailable={githubStatusResult.unavailable}
    />
  )
}
