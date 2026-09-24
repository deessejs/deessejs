import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import createMiddleware from "next-intl/middleware"

import { routing } from "@workspace/i18n/routing"
import { API_AUTH_PATH } from "@workspace/api/base-path"

const SUPPORTED_LOCALES = ["en", "fr"] as const

// Static matcher — Next 16 requires `config.matcher` to be a static
// string / array literal *inline* (it does static analysis at compile
// time and does not follow `const` references for `matcher`). The
// list below is the explicit union of:
//   - next-intl: every path under [locale]/* and the canonical root
//     paths (locale detection + auth gate + /device).
//   - auth gate: the dual-form protected/auth/device paths × locales.
export const config = {
  matcher: [
    // next-intl middleware (locale detection): every non-asset, non-API path
    "/((?!api|_next|_vercel|favicon\\.ico|.*\\..*).*)",
    // Protected, unprefixed (default locale)
    "/home",
    "/home/:path*",
    "/settings",
    "/settings/:path*",
    // Protected, /fr/ prefixed
    "/fr/home",
    "/fr/home/:path*",
    "/fr/settings",
    "/fr/settings/:path*",
    // Auth pages, unprefixed
    "/login",
    "/login/:path*",
    "/signup",
    "/signup/:path*",
    "/forgot-password",
    "/forgot-password/:path*",
    "/reset-password",
    "/reset-password/:path*",
    "/verify-email",
    "/verify-email/:path*",
    // Auth pages, /fr/ prefixed
    "/fr/login",
    "/fr/login/:path*",
    "/fr/signup",
    "/fr/signup/:path*",
    "/fr/forgot-password",
    "/fr/forgot-password/:path*",
    "/fr/reset-password",
    "/fr/reset-password/:path*",
    "/fr/verify-email",
    "/fr/verify-email/:path*",
    // /device — unprefixed (CLI auth callback lands here unauthenticated,
    // the page-level Server Component handles the routing per ADR-022 §"Bug B")
    "/device",
    "/device/:path*",
    "/fr/device",
    "/fr/device/:path*",
  ],
}

// Protected routes (auth required). The matcher covers both forms
// because of `localePrefix: 'as-needed'` — the default locale (`en`)
// renders at the URL root (`/home`), while non-default locales
// render under a prefix (`/fr/home`). The proxy must gate both.
const PROTECTED_PREFIXES = ["/home", "/settings"]
const AUTH_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]

/**
 * Strip the locale prefix from `pathname` for proxy logic. The
 * default locale renders unprefixed (`/home`); non-default locales
 * render prefixed (`/fr/home`). The proxy reads the strip to decide
 * whether the request is `protected` or `auth`; redirects preserve
 * the original locale so a French user stays on the French login.
 *
 * Shape (`localePrefix: 'as-needed'`):
 *   `/home`           → `/home`
 *   `/fr/home`        → `/home`
 *   `/home/x`         → `/home/x`
 *   `/fr/home/x`      → `/home/x`
 *   `/fr`             → `/`
 *   `/`               → `/`
 */
function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/(en|fr|de)(?:\/(.*))?$/)
  if (!match) return pathname
  const [, , rest] = match
  return rest !== undefined ? `/${rest}` : "/"
}

/** Return the locale prefix segment from a pathname (e.g. `/fr/home` → `/fr`). Empty string for unprefixed paths. */
function prefixOf(pathname: string): string {
  const match = pathname.match(/^\/(en|fr|de)(?:\/|$)/)
  return match ? `/${match[1]}` : ""
}

// Build the next-intl middleware once at module top-level. The
// middleware returns either a `NextResponse` (locale detection
// redirect or rewrite) or `undefined` (let the request pass through
// to the next handler — the auth gate below).
const intlMiddleware = createMiddleware(routing)

interface GetSessionResponse {
  session?: { user?: { emailVerified?: boolean } }
}

export async function proxy(request: NextRequest) {
  // 1. Locale detection: next-intl may redirect on first hit
  // (cookie + Accept-Language detection). If it returns a
  // NextResponse, the auth gate is irrelevant — the user is being
  // bounced to the prefixed URL before any auth check.
  const intlResponse = intlMiddleware(request)
  if (intlResponse && intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse
  }
  // If next-intl returns a rewrite (the `/_next/` internal rewrite
  // for `[[...locale]]` segments), we continue through the auth
  // gate with the rewritten URL.
  // See https://next-intl.dev/docs/routing/middleware for the
  // contract.

  const pathname = request.nextUrl.pathname
  const stripped = stripLocalePrefix(pathname)
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => stripped.startsWith(p),
  )
  const isAuthPage = AUTH_PREFIXES.some(
    (p) => stripped === p || stripped.startsWith(`${p}/`),
  )

  if (!isProtected && !isAuthPage) {
    return intlResponse ?? NextResponse.next()
  }

  // The proxy self-fetches `/api/v1/auth/get-session` instead of
  // importing `better-auth` directly. better-auth transitively
  // imports postgres via the @better-auth/drizzle adapter, which
  // Turbopack cannot bundle for any runtime (fs/net/os imports fail
  // at build time). The fetch path uses only Web APIs that work in
  // every runtime Next.js supports. The auth route handler at
  // /api/auth/get-session runs on the Node runtime in the api package,
  // where postgres works natively.
  //
  // Next.js 16 always runs proxy files on the Node.js runtime —
  // setting `export const runtime = "nodejs"` here is rejected at build
  // time ("Route segment config is not allowed in Proxy file").

  const getSessionUrl = new URL(
    `${API_AUTH_PATH}/get-session`,
    request.nextUrl.origin,
  )
  const response = await fetch(getSessionUrl, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  })
  const session = (response.ok
    ? ((await response.json()) as GetSessionResponse | null)
    : null)

  // Preserve the user's locale across the redirect. A user who
  // lands on `/fr/home` unauthenticated lands on `/fr/login`, not
  // `/login`. The redirect URL is built from `request.url`
  // (preserves the original locale) and only the path portion is
  // rewritten per the gate logic.
  if (isProtected && !session?.session) {
    const loginUrl = new URL(request.url)
    loginUrl.pathname = `${prefixOf(pathname)}/login`
    loginUrl.searchParams.set("redirect", stripped)
    return NextResponse.redirect(loginUrl)
  }

  if (
    isProtected &&
    session?.session?.user &&
    !session.session.user.emailVerified
  ) {
    const verifyUrl = new URL(request.url)
    verifyUrl.pathname = `${prefixOf(pathname)}/verify-email`
    return NextResponse.redirect(verifyUrl)
  }

  if (isAuthPage && session?.session) {
    const homeUrl = new URL(request.url)
    homeUrl.pathname = `${prefixOf(pathname)}/home`
    return NextResponse.redirect(homeUrl)
  }

  return intlResponse ?? NextResponse.next()
}
