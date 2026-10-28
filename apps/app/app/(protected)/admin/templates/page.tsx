import { requireAdmin } from "@/lib/admin-auth"
import { orpc } from "@/lib/orpc"
import { AdminTemplatesPage } from "@/components/admin/templates/admin-templates-page"

export default async function TemplatesAdminPage() {
  await requireAdmin()
  const result = await orpc.admin.templates.list()

  return <AdminTemplatesPage templates={result.templates} />
}
