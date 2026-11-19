import { OrganizationBilling } from "@/components/settings/organization-billing"
import { readWorkspaceOrganization } from "@/lib/workspace-organization"

export default async function OrganizationBillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ organization_slug: string }>
  searchParams: Promise<{ billing?: string }>
}) {
  const [{ organization_slug }, query] = await Promise.all([
    params,
    searchParams,
  ])
  const organization = await readWorkspaceOrganization(organization_slug)

  return (
    <OrganizationBilling
      organization={organization}
      billingReturn={query.billing}
    />
  )
}
