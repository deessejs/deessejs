import { requireAdmin } from "@/lib/admin-auth"
import { redirect } from "next/navigation"

/**
 * Keep old bookmarks working after the catalog became the admin landing page.
 */
export default async function AdminHomePage() {
  await requireAdmin()
  redirect("/admin/templates")
}
