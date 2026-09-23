import createMiddleware from "next-intl/middleware"

import { routing } from "@workspace/i18n/routing"

/**
 * Auth-app middleware — per ADR-031 Decision #2.
 *
 * Same shape as apps/web/middleware.ts. The auth-app middleware
 * matcher adds an explicit exclusion of `/api/*` so the locale-invariant
 * Hono catch-all at `apps/app/app/api/[[...route]]/route.ts` (per
 * ADR-021 + ADR-031 Decision #3) is not subject to locale
 * redirection.
 */
export default createMiddleware(routing)

export const config = {
  // The middleware must exclude:
  //   - `/api/*` — locale-invariant Hono backend
  //   - `/_next/*`, `/_vercel/*` — Next.js / Vercel internals
  //   - Asset paths (every URL containing a dot in its last segment)
  matcher: [
    "/((?!api|_next|_vercel|favicon\\.ico|icon\\.svg|.*\\..*).*)",
  ],
}
