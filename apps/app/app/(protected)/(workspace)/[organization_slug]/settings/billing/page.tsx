import { readWorkspaceOrganization } from "@/lib/workspace-organization"
import { OrganizationBilling } from "@/components/settings/organization-billing"

export default async function OrganizationBillingPage({ params }: { params: Promise<{ organization_slug: string }> }) {
  const { organization_slug } = await params
  const organization = await readWorkspaceOrganization(organization_slug)
  return <OrganizationBilling organization={organization} />
}
