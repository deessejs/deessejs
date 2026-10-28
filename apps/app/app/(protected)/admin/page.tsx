import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/admin-auth"

/**
 * Index of the `/admin` route area (RFC: "DeesseJS Administration
 * Routes — V1" §2.4 and §5).
 *
 * Authorized administrators landing on `/admin` are redirected to the
 * template catalog, the admin area's only destination. The guard runs first; an
 * unauthenticated visitor or a non-admin user never reaches the
 * `redirect()` call (and is already handled by the proxy plus the
 * guard's own `notFound()` / `redirect("/login...")`).
 */
export default async function AdminIndexPage() {
  await requireAdmin()
  redirect("/admin/templates")
}
