import { requireAdmin } from "@/lib/admin-auth"
import { orpc } from "@/lib/orpc"
import { AdminBlockSubmissionsPage } from "@/components/admin/blocks/admin-block-submissions-page"
export default async function BlockSubmissionsRoute() {
  await requireAdmin()
  const result = await orpc.admin.templates.blockPublications.list()
  return <AdminBlockSubmissionsPage submissions={result.submissions} />
}
