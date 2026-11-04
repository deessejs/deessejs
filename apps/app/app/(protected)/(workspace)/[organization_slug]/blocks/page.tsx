import { hasManagingRole } from "@workspace/auth/organization/roles"
import { readWorkspaceOrganization } from "@/lib/workspace-organization"
import { orpc } from "@/lib/orpc"
import { OrganizationBlocksPage } from "@/components/organizations/blocks/organization-blocks-page"

export default async function OrganizationBlocksRoute({ params }: { params: Promise<{ organization_slug: string }> }) {
  const { organization_slug } = await params
  const organization = await readWorkspaceOrganization(organization_slug)
  let blocks: Awaited<ReturnType<typeof orpc.organization.blocks.list>>["blocks"] = []
  let error: string | null = null
  try { blocks = (await orpc.organization.blocks.list({ organizationSlug: organization_slug })).blocks } catch { error = "Couldn't load organization blocks. Try again." }
  return <OrganizationBlocksPage organizationSlug={organization_slug} blocks={blocks} canManage={hasManagingRole(organization.role)} error={error} />
}
