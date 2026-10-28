import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { API_AUTH_PATH } from "@workspace/api/base-path"
import { RESERVED_SLUGS } from "@workspace/auth/organization/reserved-slugs"

import { SETTINGS_PREFIX } from "@/lib/settings-paths"
import { NO_ORGANIZATION_PATH } from "@/lib/workspace-paths"

const PROTECTED_PREFIXES = [
  "/home",
  SETTINGS_PREFIX,
  "/admin",
  NO_ORGANIZATION_PATH,
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
  // The workspace tree is `/[organization_slug]/*`, whose first
  // segment is not known in advance, so a literal list cannot express
  // it. The matcher is a regular expression that covers every path
  // whose first segment is neither the API mount nor the framework's
  // own files. The classification of what to do with a path is the
  // function's job, below.
  matcher: ["/((?!api(?:/|$)|_next(?:/|$))[^/]+(?:/.*)?)"],
}

/**
 * Whether the path names a file rather than a route.
 *
 * Next's file-based routing means a route segment never carries an
 * extension, and the public folder is served as it is on disk. Any
 * segment carrying an extension makes the path a file, whatever its
 * first segment is, and a file is never gated.
 */
const isFilePath = (pathname: string): boolean =>
  pathname.split("/").some((segment) => segment.includes("."))

/** The first segment of the path. */
const firstSegment = (pathname: string): string => {
  const segments = pathname.split("/").filter((segment) => segment !== "")
  return segments[0] ?? ""
}

/**
 * Whether the path is protected.
 *
 * A path whose first segment the application owns is an application
 * route, and the per-prefix rules decide it. Any other first segment
 * is an organization slug, and the organization tree is protected:
 * the workspace pages need a session, and the API refuses a caller
 * who does not belong to the organization they named.
 */
const isProtectedPath = (pathname: string): boolean => {
  if (isFilePath(pathname)) return false
  const first = firstSegment(pathname)
  if (first === "") return false
  if (RESERVED_SLUGS.has(first)) {
    return PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  }
  return true
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

function parseGetSessionResponse(value: unknown): GetSessionResponse | null {
  if (typeof value !== "object" || value === null) return null

  let session: { id: string } | undefined
  if ("session" in value) {
    const parsedSession = parseSession(value.session)
    if (!parsedSession) return null
    session = parsedSession
  }

  let user: { emailVerified?: boolean; role?: string | null } | undefined
  if ("user" in value) {
    const parsedUser = parseSessionUser(value.user)
    if (!parsedUser) return null
    user = parsedUser
  }

  return {
    ...(session ? { session } : {}),
    ...(user ? { user } : {}),
  }
}

function parseSession(value: unknown): { id: string } | null {
  if (typeof value !== "object" || value === null) return null
  if (!("id" in value) || typeof value.id !== "string") return null
  return { id: value.id }
}

function parseSessionUser(
  value: unknown
): { emailVerified?: boolean; role?: string | null } | null {
  if (typeof value !== "object" || value === null) return null
  const emailVerified =
    "emailVerified" in value ? value.emailVerified : undefined
  const role = "role" in value ? value.role : undefined
  if (emailVerified !== undefined && typeof emailVerified !== "boolean") {
    return null
  }
  if (role !== undefined && typeof role !== "string" && role !== null) {
    return null
  }
  return {
    ...(typeof emailVerified === "boolean" ? { emailVerified } : {}),
    ...(typeof role === "string" || role === null ? { role } : {}),
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  // Segment-aware prefix match. The previous `startsWith(prefix)` form
  // would also match unrelated paths that happen to share a prefix
  // (e.g. `/administer`), which is fine for the existing
  // protected prefixes but not future-proof. Equality OR a trailing
  // slash is the correct gate; it also aligns the auth-prefix check
  // (which already used this shape).
  const isProtected = isProtectedPath(pathname)
  const isAuthPage = AUTH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
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
    request.nextUrl.origin
  )
  const response = await fetch(getSessionUrl, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
    cache: "no-store",
  })
  const session = response.ok
    ? parseGetSessionResponse(await response.json())
    : null

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

  return NextResponse.next()
}
