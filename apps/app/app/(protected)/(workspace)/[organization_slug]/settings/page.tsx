import { redirect } from "next/navigation"

import { workspaceOrganizationSettingsPath } from "@/lib/workspace-paths"

export default async function OrganizationSettingsIndex({
  params,
}: {
  params: Promise<{ organization_slug: string }>
}) {
  const { organization_slug } = await params
  redirect(workspaceOrganizationSettingsPath(organization_slug))
}
