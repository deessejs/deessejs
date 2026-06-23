import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@deessejs/auth"

import { LoginForm } from "@/components/auth/login-form"

/**
 * Login page. URL: /login.
 *
 * Server component. Reads `?redirect=` and `?reset=success` from
 * searchParams (async in Next 16), checks the current session, and
 * either redirects to /dashboard (already logged in) or renders the
 * form with the right state.
 */
type SearchParams = Promise<{
  redirect?: string
  reset?: string
  verified?: string
}>

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams

  // If the user is already signed in, skip the form entirely.
  const session = await auth.api.getSession({ headers: await headers() })
  if (session) {
    redirect(params.redirect ?? "/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your account.
        </p>
      </div>

      <LoginForm
        redirectTo={params.redirect}
        showResetSuccess={params.reset === "success"}
        showVerifiedSuccess={params.verified === "1"}
      />

      <p className="text-center text-sm text-muted-foreground">
        Don&rsquo;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
