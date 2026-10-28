import { connection } from "next/server"

import { OrganizationList } from "@/components/organizations/organization-list"

/**
 * The organizations.
 *
 * The page lists every organization the caller belongs to, and the
 * caller picks one from it. The list comes from the browser, because
 * it is the caller's own memberships and the plugin's own endpoint
 * serves it.
 *
 * The page is rendered at request time. The request guard is the
 * gate, and a page whose content is about the caller has no business
 * being a cached document.
 */
export default async function OrganizationsPage() {
  await connection()

  return <OrganizationList />
}
