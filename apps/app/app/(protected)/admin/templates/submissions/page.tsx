import { requireAdmin } from "@/lib/admin-auth"
import { orpc } from "@/lib/orpc"
import { AdminTemplateSubmissionsPage } from "@/components/admin/templates/admin-template-submissions-page"

export default async function TemplateSubmissionsAdminPage() {
  await requireAdmin()
  const result = await orpc.admin.templates.publications.list()

  return <AdminTemplateSubmissionsPage submissions={result.submissions} />
}
