import type { ReactNode } from "react"

/**
 * Passthrough for the `(protected)` route group.
 *
 * The proxy at `apps/app/proxy.ts` is the authoritative auth + email
 * verification gate: anything matching `PROTECTED_PREFIXES` without a
 * valid session is bounced to `/login`, and an unverified user is
 * bounced to `/verify-email`. By the time we render here, the user
 * is authenticated, so this layout does not re-read the session and
 * does not render chrome.
 *
 * The route group exists as the anchor under which the workspace,
 * account settings, and `admin/` sit as siblings. Each surface owns
 * its own shell. Future cross-cutting UI for all authenticated
 * surfaces has a natural home here.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode
}) {
  return <>{children}</>
}
