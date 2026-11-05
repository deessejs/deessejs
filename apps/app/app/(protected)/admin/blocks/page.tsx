import { requireAdmin } from "@/lib/admin-auth"
import { orpc } from "@/lib/orpc"
import { AdminOfficialBlocksPage } from "@/components/admin/blocks/admin-official-blocks-page"

export default async function OfficialBlocksRoute() {
  await requireAdmin()
  const result = await orpc.admin.blocks.listOfficial()
  return <AdminOfficialBlocksPage blocks={result.blocks} />
}
