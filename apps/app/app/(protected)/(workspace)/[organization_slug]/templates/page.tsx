import { hasManagingRole } from "@workspace/auth/organization/roles"
import { readWorkspaceOrganization } from "@/lib/workspace-organization"
import { orpc } from "@/lib/orpc"
import { OrganizationTemplatesPage } from "@/components/organizations/templates/organization-templates-page"

export default async function OrganizationTemplatesRoute({
  params,
}: {
  params: Promise<{ organization_slug: string }>
}) {
  const { organization_slug } = await params
  const organization = await readWorkspaceOrganization(organization_slug)

  let templates: Awaited<
    ReturnType<typeof orpc.organization.templates.list>
  >["templates"] = []
  let fetchError: string | null = null
  try {
    const result = await orpc.organization.templates.list({
      organizationSlug: organization_slug,
    })
    templates = result.templates
  } catch {
    fetchError = "We couldn't load this organization's templates. Try again."
  }

  return (
    <OrganizationTemplatesPage
      organizationSlug={organization_slug}
      organizationName={organization.name}
      canManage={hasManagingRole(organization.role)}
      templates={templates}
      fetchError={fetchError}
    />
  )
}
