import { hasManagingRole } from "@workspace/auth/organization/roles"

import { MemberManagement } from "@/components/organizations/member-management"
import { readWorkspaceOrganization } from "@/lib/workspace-organization"

export default async function OrganizationMembersPage({
  params,
}: {
  params: Promise<{ organization_slug: string }>
}) {
  const { organization_slug } = await params
  const organization = await readWorkspaceOrganization(organization_slug)

  return (
    <MemberManagement
      organizationId={organization.id}
      slug={organization.slug}
      canManage={hasManagingRole(organization.role)}
    />
  )
}
