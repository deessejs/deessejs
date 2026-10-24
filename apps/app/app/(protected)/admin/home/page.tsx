import { requireAdmin } from "@/lib/admin-auth"

/**
 * Initial `/admin/home` page (RFC: "DeesseJS Administration Routes —
 * V1" §2.3, §5, §6.2).
 *
 * V1 scope is a minimal entry point: a heading and a one-line
 * description. The RFC explicitly does not include operational
 * metrics, user tables, or any action buttons that would require
 * additional backend work (RFC §2). The page is the future home
 * for the next concrete admin feature (e.g. template administration,
 * Stripe operations, or organization governance) — each will land
 * as a sibling page under `/admin/*` and call `requireAdmin()`
 * itself.
 *
 * The heading style matches the existing `home/page.tsx` heading
 * (`text-3xl font-bold tracking-tight`) so the admin area feels
 * like a continuation of the product shell, not a separate surface.
 */
export default async function AdminHomePage() {
  await requireAdmin()
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
      <p className="text-sm text-muted-foreground">
        DeesseJS administration area.
      </p>
    </div>
  )
}
