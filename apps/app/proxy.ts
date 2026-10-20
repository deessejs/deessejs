import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { API_AUTH_PATH } from "@workspace/api/base-path"

import {
  LEGACY_SETTINGS_PREFIX,
  SETTINGS_PREFIX,
  legacySettingsDestination,
} from "@/lib/settings-routes"

const PROTECTED_PREFIXES = [
  "/home",
  // The account settings. `/settings` is the legacy prefix: it stays
  // protected for the duration of the cutover, and the redirect below
  // moves it to `/account/settings/*`.
  SETTINGS_PREFIX,
  LEGACY_SETTINGS_PREFIX,
  "/admin",
]
const AUTH_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  // /device is intentionally NOT here: an authenticated user
  // landing on /device from the CLI's auth login must see the
  // approve / deny view, not /home. Routing is owned by the
  // page-level Server Component (the previous Bug B caused an
  // authenticated user to be bounced from /device to /home
  // before they could approve the CLI's login).
]

export const config = {
  // Single matcher covering both directions of the auth gate.
  matcher: [
    "/home/:path*",
    "/account/settings/:path*",
    // The legacy settings paths stay matched for the duration of the
    // cutover: the proxy redirects them to their new destination.
    "/settings/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/device",
  ],
}

// The proxy uses a pure HTTP fetch to /api/auth/get-session
// instead of importing better-auth directly. better-auth transitively
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
//
// `cache: "no-store"` makes the request-specific behaviour explicit:
// the proxy must always read the current session cookie and never a
// cached response. Added in the V1 admin RFC (§6.4) alongside the
// `/admin` prefix to keep the gate decision per-request.

interface GetSessionResponse {
  // Better Auth's `/get-session` returns either `null` or
  // `{ session, user }` at the top level. Earlier revisions of this
  // proxy assumed a nested `session.user` shape, which silently
  // disabled the email-verification check on every protected route
  // (the property was always undefined). The corrected shape lines
  // up with `packages/api/src/http/middleware/session.ts`, which
  // also reads `data.user` and `data.session` as siblings.
  session?: { id: string }
  user?: { emailVerified?: boolean; role?: string | null }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  // Segment-aware prefix match. The previous `startsWith(prefix)` form
  // would also match unrelated paths that happen to share a prefix
  // (e.g. `/settings-something`), which is fine for the existing
  // protected prefixes but not future-proof. Equality OR a trailing
  // slash is the correct gate; it also aligns the auth-prefix check
  // (which already used this shape).
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  const isAuthPage = AUTH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )

  // Only call getSession when the route actually needs the gate decision.
  // Avoids a roundtrip on every static asset or unrelated request.
  if (!isProtected && !isAuthPage) {
    return NextResponse.next()
  }

  // The proxy self-fetches `/api/v1/auth/get-session` instead of
  // importing `better-auth` directly. The fetch must hit the
  // *same* origin the request is being processed under — never a
  // hardcoded `API_BASE_URL` env var. On Vercel previews the
  // origin is the per-branch hostname
  // (`deessejs-app-git-<branch>.vercel.app`); on prod it's
  // `app.deessejs.com`; in dev it's `localhost:3001`. Reading the
  // origin off the incoming `request.nextUrl` makes the proxy
  // adapt automatically without per-environment env wiring, and
  // it keeps the self-fetch in the same Function (no DNS hop,
  // no port resolution).
  //
  // The inter-app URL config notes that composing the URL from
  // `serverEnv.API_BASE_URL` works for the cross-app case
  // (`apps/web` calling into `apps/app`) but breaks for the
  // self-fetch here, because `API_BASE_URL` is not set on every
  // preview deploy and falls back to `http://localhost:3001` —
  // which is not listening on Vercel. See the dev-comment on
  // `serverEnv.API_BASE_URL` for the same caveat.
  const getSessionUrl = new URL(
    `${API_AUTH_PATH}/get-session`,
    request.nextUrl.origin,
  )
  const response = await fetch(getSessionUrl, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
    cache: "no-store",
  })
  const session = (response.ok
    ? ((await response.json()) as GetSessionResponse | null)
    : null)

  if (isProtected && !session?.session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isProtected && session?.user && !session.user.emailVerified) {
    return NextResponse.redirect(new URL("/verify-email", request.url))
  }

  // Verified-email bounce fix (RFC "DeesseJS Administration Routes —
  // V1" §6.4). Without this carve-out, an unverified user who lands
  // on `/verify-email` (the destination of the protected-route
  // redirect above) is matched as `isAuthPage` AND as
  // `session.session` exists, so the next branch would bounce them
  // straight back to `/home`, which itself redirects to
  // `/verify-email`, looping. The user is stuck until they verify
  // their email. Excluding the verification page from the bounce
  // while the email is still unverified breaks the loop. Once the
  // email is verified the page is no longer in the bounce set and
  // the normal `/home` flow takes over.
  const needsEmailVerification =
    pathname === "/verify-email" && session?.user?.emailVerified === false

  if (isAuthPage && session?.session && !needsEmailVerification) {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  // The account settings moved from `/settings/*` to
  // `/account/settings/*`. The legacy paths stay reachable for the
  // duration of the cutover and are redirected to their new
  // destination here.
  //
  // The redirect sits *after* the auth checks on purpose. An
  // unauthenticated visitor on `/settings/profile` is sent to
  // `/login?redirect=/settings/profile`, and the legacy path is
  // resolved to its new destination once they are signed in. Moving
  // the redirect above the checks would rewrite the URL the login
  // page returns the user to, and would hide the legacy path from
  // the gate that is supposed to protect it.
  const legacyDestination = legacySettingsDestination(pathname)
  if (legacyDestination) {
    const target = new URL(legacyDestination, request.url)
    // Carry the query string across: a deep link to a legacy settings
    // leaf with a tab or a filter selected must not lose it.
    target.search = request.nextUrl.search
    return NextResponse.redirect(target)
  }

  return NextResponse.next()
}
