import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { API_AUTH_PATH } from "@workspace/api/base-path"
import { serverEnv } from "@workspace/env/server"

const PROTECTED_PREFIXES = ["/home", "/settings"]
const AUTH_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  // Device verification page (ADR-020): the CLI's auth login
  // command opens the browser to /device?user_code=XXX. A
  // user already signed in lands directly on the
  // approve / deny view instead of being bounced to /login.
  // The prefix match (no trailing slash) is intentional: only
  // /device itself and an exact match get the bypass; a
  // future /device/<sub> route is opted in separately.
  "/device",
]

export const config = {
  // Single matcher covering both directions of the auth gate.
  matcher: [
    "/home/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
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

interface GetSessionResponse {
  session?: { user?: { emailVerified?: boolean } }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthPage = AUTH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )

  // Only call getSession when the route actually needs the gate decision.
  // Avoids a roundtrip on every static asset or unrelated request.
  if (!isProtected && !isAuthPage) {
    return NextResponse.next()
  }

  // Per ADR-021: the proxy URL is composed from the path
  // constant and the host constant, no longer relative to the
  // incoming request. The two apps share `API_BASE_URL`, so
  // this expression is identical on staging, prod, and dev. A
  // future split of apps/app and the API (e.g. an
  // `api.deessejs.com` deployment) is a one-line env var change
  // rather than a code refactor.
  const getSessionUrl = new URL(
    `${API_AUTH_PATH}/get-session`,
    serverEnv.API_BASE_URL,
  )
  const response = await fetch(getSessionUrl, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  })
  const session = (response.ok
    ? ((await response.json()) as GetSessionResponse | null)
    : null)

  if (isProtected && !session?.session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isProtected && session?.session?.user && !session.session.user.emailVerified) {
    return NextResponse.redirect(new URL("/verify-email", request.url))
  }

  if (isAuthPage && session?.session) {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  return NextResponse.next()
}
