import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { authClient } from "@/lib/auth-client"

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

// The proxy uses the better-auth client (HTTP roundtrip) instead of
// the server-side auth.api.getSession(...) import. The server-side
// API transitively imports postgres through packages/database,
// which Turbopack cannot bundle for any runtime (the path resolution
// fails on fs/net/os imports inside postgres). Using the client
// avoids the postgres import path entirely because the proxy
// only needs HTTP, and fetch is supported in every runtime
// Next.js supports (Edge and Node).
export const runtime = "nodejs"

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

  const { data: session } = await authClient.getSession({
    fetchOptions: { headers: request.headers },
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
