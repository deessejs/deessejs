import "server-only"

import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { auth } from "@workspace/auth"

type AdminSession = {
  session: { id: string }
  user: { id: string; role: string | null }
}

function isAdminSession(value: unknown): value is AdminSession {
  return (
    typeof value === "object" &&
    value !== null &&
    "session" in value &&
    typeof value.session === "object" &&
    value.session !== null &&
    "id" in value.session &&
    typeof value.session.id === "string" &&
    "user" in value &&
    typeof value.user === "object" &&
    value.user !== null &&
    "id" in value.user &&
    typeof value.user.id === "string" &&
    "role" in value.user &&
    (typeof value.user.role === "string" || value.user.role === null)
  )
}

/**
 * Server-only guard for the `/admin/*` route area.
 *
 * Implements RFC "DeesseJS Administration Routes — V1" §6.1.
 *
 * Flow:
 *   1. Resolve the current session via the same `auth.api.getSession`
 *      pattern the rest of the app uses
 *      (see `apps/app/app/(unprotected)/(auth)/device/page.tsx`).
 *   2. Missing or expired session → `redirect` to the existing sign-in
 *      route with a `redirect` query so the user returns to
 *      `/admin/home` after authenticating. The post-login wiring that
 *      consumes this query is added in the same PR; until it lands,
 *      the parameter is ignored and the user lands on `/home` (the
 *      existing behaviour), which is the safe fallback.
 *   3. Authenticated user whose global role is not exactly `"admin"`
 *      → `notFound()`. The role check uses strict equality; the admin
 *      plugin's `role` column is a string (or comma-separated string
 *      for multi-role), but V1 only ever writes a single value, and
 *      substring / comma-split checks would be wrong: `"superadmin"`
 *      is not `"admin"`, and `"admin,user"` is two roles, not one.
 *   4. Otherwise return the actor's user id. The caller is responsible
 *      for re-reading the current role from the database if it needs
 *      to act on data — this helper authorizes the *route*, not the
 *      *action* (see RFC §6.3 for the action-level invariant that
 *      future Server Actions / Route Handlers must enforce).
 *
 * The current Better Auth install does not enable cookie caching or
 * any secondary session storage, so `auth.api.getSession` reads the
 * session joined to the current user from the database — the role
 * returned here is always the live role, not a snapshot. If cookie
 * caching is ever introduced, this helper must re-read `user.role`
 * from the DB rather than trusting the cached session payload.
 */
export async function requireAdmin(): Promise<{ userId: string }> {
  const result: unknown = await auth.api.getSession({
    headers: await headers(),
  })

  if (!isAdminSession(result)) {
    redirect("/login?redirect=%2Fadmin%2Fhome")
  }

  if (result.user.role !== "admin") {
    notFound()
  }

  return { userId: result.user.id }
}
