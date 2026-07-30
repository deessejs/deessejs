import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@workspace/auth"
import type { Session, User } from "better-auth"

const PROTECTED_PREFIXES = ["/home", "/settings"]
const AUTH_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
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

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthPage = AUTH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )

  // Only call getSession when the route actually needs the gate decision.
  // Avoids a DB roundtrip on every static asset or unrelated request.
  if (!isProtected && !isAuthPage) {
    return NextResponse.next()
  }

  // Server-side session read. The previous workaround used
  // authClient.getSession() (an HTTP roundtrip to /api/auth/get-session)
  // so the build worked without serverEnv. With turbo.json now caching
  // dist/** (#44), serverEnv is reachable at build time — use the
  // server-side API directly instead of bouncing through HTTP.
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (isProtected && !session?.session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isProtected && session?.user && !session.user.emailVerified) {
    return NextResponse.redirect(new URL("/verify-email", request.url))
  }

  if (isAuthPage && session?.session) {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  return NextResponse.next()
}

// Re-export types for consumers
export type { Session, User }
