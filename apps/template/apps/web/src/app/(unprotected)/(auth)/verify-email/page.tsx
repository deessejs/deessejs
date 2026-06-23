import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@deessejs/auth"

import { ResendVerificationButton } from "@/components/auth/resend-verification-button"

/**
 * "Check your inbox" page. URL: /verify-email?email=...
 *
 * Server component. Reads the email from the query string and renders
 * a notice + resend button. The resend button is a small client island
 * that calls Better Auth's `sendVerificationEmail`.
 *
 * The user lands here after signup (because `requireEmailVerification:
 * true` means sign-up returns no session). They click the link in
 * the email, which Better Auth consumes at /api/auth/verify-email,
 * then redirects to the `callbackURL` (we set `/login?verified=1`).
 *
 * If the user is **already signed in** (came back to the URL after
 * completing the flow), we send them to /dashboard — they have
 * nothing to do here. Same guard pattern as login/page.tsx.
 *
 * In dev, the email goes to the ConsoleMailer (logs to the dev
 * server stdout with the `links[]` array thanks to the extension we
 * added) — copy/paste the verification URL from there.
 */
type SearchParams = Promise<{ email?: string; redirect?: string }>

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { email, redirect: redirectTo } = await searchParams

  // Already signed in → nothing to verify, send them to the app.
  const session = await auth.api.getSession({ headers: await headers() })
  if (session) {
    redirect(redirectTo ?? "/dashboard")
  }

  if (!email) {
    return (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            Open the link we sent to your email to verify your account and
            finish signing up.
          </p>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/signup"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Back to sign up
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-full border border-border bg-muted text-foreground"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Check your inbox
          </h1>
          <p className="text-sm text-muted-foreground">
            We&rsquo;ve sent a verification link to{" "}
            <span className="font-medium text-foreground">{email}</span>.
            Click the link to finish setting up your account.
          </p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Running locally?</p>
        <p className="mt-0.5">
          The email goes to the dev server console. Look for{" "}
          <code className="rounded bg-background px-1 py-0.5 font-mono text-[11px]">
            links
          </code>{" "}
          in the log &mdash; copy/paste the verification URL into your
          browser.
        </p>
      </div>

      <ResendVerificationButton email={email} />

      <p className="text-center text-sm text-muted-foreground">
        Wrong email?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign up again
        </Link>
      </p>
    </div>
  )
}
