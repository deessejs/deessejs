import { requireAdmin } from "@/lib/admin-auth"
import Link from "next/link"
import { Button } from "@workspace/ui/components/button"

/**
 * Initial `/admin/home` page (RFC: "DeesseJS Administration Routes —
 * V1" §2.3, §5, §6.2).
 *
 * V1 scope is a minimal entry point: a heading and a one-line
 * description. Operational metrics, user tables, and actions requiring
 * additional backend work are out of scope. The page is the home for
 * future admin features, which live on sibling routes under `/admin/*`.
 */
export default async function AdminHomePage() {
  await requireAdmin()
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
      <p className="text-sm text-muted-foreground">
        DeesseJS administration area.
      </p>
      <div>
        <Button asChild variant="outline">
          <Link href="/admin/templates">Manage templates</Link>
        </Button>
      </div>
    </div>
  )
}
