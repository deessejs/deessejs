import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import createMiddleware from "next-intl/middleware"

import { routing } from "@workspace/i18n/routing"
import type { Bcp47 } from "@workspace/i18n"
import { API_AUTH_PATH } from "@workspace/api/base-path"

const SUPPORTED_LOCALES = ["en", "fr"] as const satisfies readonly Bcp47[]

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
  // /device is intentionally NOT here: an authenticated user
  // landing on /device from the CLI's auth login must see the
  // approve / deny view, not /home. Routing is owned by the
  // page-level Server Component. See ADR-022 §"Bug B".
]

// Build the matcher list as a cartesian product: every protected/auth
// path × (unprefixed + `/fr/` prefixed).
function dualForm(path: string, withPrefix?: boolean): string[] {
  if (withPrefix === false) return [path]
  return SUPPORTED_LOCALES.flatMap((locale) =>
    [path, `${path}/:path*`].flatMap((p) => {
      if (p.includes("/:path*")) {
        return [`/${locale}${p}`]
      }
      return [`/${locale}${p}`, `${locale}${p}/:path*`]
    }),
  )
}

const PROTECTED_MATCHER = PROTECTED_PREFIXES.flatMap((p) => [
  ...dualForm(p, true),
  p,
  `${p}/:path*`,
])

const AUTH_MATCHER = AUTH_PREFIXES.flatMap((p) => {
  const out: string[] = []
  for (const locale of SUPPORTED_LOCALES) {
    out.push(`/${locale}${p}`, `/${locale}${p}/:path*`)
  }
  out.push(p, `${p}/:path*`)
  return out
})

const DEVICE_MATCHER = ["/device", "/device/:path*"].flatMap((p) => [
  p,
  ...SUPPORTED_LOCALES.map((locale) => `/${locale}${p}` as string),
])

// Match everything under the proxy so the next-intl middleware runs
// first (auto-detection) and the auth gate runs after. The next-intl
// middleware itself skips `/api/*`, `_next/*`, etc., via its own matcher;
// the auth gate only acts on `PROTECTED_PREFIXES` / `AUTH_PREFIXES`.
// We therefore union all routes the proxy must observe:
//   - next-intl matcher:  /((?!api|_next|_vercel|favicon\\.ico|.*\\..*).*)
//   - auth gate:          the dual-form protected/auth/device paths
export const config = {
  matcher: [
    "/((?!api|_next|_vercel|favicon\\.ico|.*\\..*).*)",
    ...PROTECTED_MATCHER,
    ...AUTH_MATCHER,
    ...DEVICE_MATCHER,
  ],
}

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
