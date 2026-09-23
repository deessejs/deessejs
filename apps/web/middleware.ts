import createMiddleware from "next-intl/middleware"

import { routing } from "@workspace/i18n/routing"

/**
 * Marketing-site middleware — per ADR-031 Decision #2.
 *
 * `createMiddleware(routing)` with `localePrefix: 'as-needed'` and
 * `localeDetection: true` provides:
 *   - Auto-detection at first hit: reads `NEXT_LOCALE` cookie, then
 *     `Accept-Language` header, and 307-redirects unprefixed URLs
 *     (`/templates`) to the prefixed equivalent (`/fr/templates`)
 *     when the detected locale differs from `defaultLocale`.
 *   - Reverse: `/fr/templates` stays stable; `/en/templates` 307s to
 *     `/templates` (per next-intl default).
 *
 * Matcher excludes `/api/*` (locale-invariant per ADR-021), the
 * Next.js internals, the Vercel preview paths, and the static
 * assets. The pattern `.*\\..*` matches any URL with a dot in the
 * last segment, which covers every static asset (favicon.ico,
 * icon.svg, apple-icon.png, files under `/public/`, etc.).
 */
export default createMiddleware(routing)

export const config = {
  matcher: ["/((?!api|_next|_vercel|favicon\\.ico|.*\\..*).*)"],
}
