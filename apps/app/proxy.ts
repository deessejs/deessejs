import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { API_AUTH_PATH } from "@workspace/api/base-path"
import { ORG_SLUG, orgHomePath } from "@/lib/org-route"

// ADR-030 §"Decision #5": the dashboard is scoped to /[orgSlug]/home.
// During the dummy phase the slug is hardcoded (`acme`); PR #4 will
// replace this with a dynamic matcher and a real active-org lookup.
const PROTECTED_PREFIXES = [orgHomePath(ORG_SLUG), "/settings"]
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
    "/acme/home/:path*", // ADR-030 §"Decision #5" per-org dashboard (dummy slug).
    "/settings/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    // Device verification page (ADR-022): the page-level
    // `auth.api.getSession` check in `app/(unprotected)/(auth)/device/page.tsx`
    // bounces anonymous visitors to /login. The proxy bounce
    // branch below (line 86-88) covers the inverse case —
    // a user who is already signed in and visits /device for
    // any reason lands on /home instead. The page-level gate
    // does its own session read; the proxy exists to skip the
    // getSession call on static assets and to enforce the
    // bounce-to-home invariant for auth pages.
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
  // ADR-021 §"Decision" #4 originally composed the URL from
  // `serverEnv.API_BASE_URL`. That works for the cross-app case
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
    return NextResponse.redirect(new URL(orgHomePath(), request.url))
  }

  return NextResponse.next()
}
