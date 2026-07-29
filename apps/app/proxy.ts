import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { authClient } from "./lib/auth-client"
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

  // Use authClient.getSession() instead of auth.api.getSession()
  // This makes an HTTP call to /api/auth/get-session instead of accessing
  // serverEnv directly, which allows the build to work without env vars.
  const { data: session } = await authClient.getSession({
    fetchOptions: {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    },
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
