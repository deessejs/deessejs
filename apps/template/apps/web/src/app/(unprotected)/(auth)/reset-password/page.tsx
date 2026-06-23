import Link from "next/link"

import { Button } from "@deessejs/ui/components/button"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"

/**
 * Reset password page. URL: /reset-password?token=...&error=...
 *
 * Server component. Reads the token + error from the query string
 * (Better Auth appends them when the user clicks the link in the
 * password-reset email).
 *
 * Three branches:
 *   - `?error=INVALID_TOKEN` → "Link invalid or expired" + "Request a new link"
 *   - no `?token`            → same "Request a new link" (defensive)
 *   - `?token=...`           → render <ResetPasswordForm token={...} />
 *
 * No session guard: a logged-in user can also reset (e.g. to change
 * their password from settings). The token in the URL is the proof
 * of identity.
 */
type SearchParams = Promise<{ token?: string; error?: string }>

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { token, error } = await searchParams

  if (error === "INVALID_TOKEN" || !token) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-full border border-destructive/30 bg-destructive/5 text-destructive"
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
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Link invalid or expired
          </h1>
          <p className="text-sm text-muted-foreground">
            Password reset links expire after 1 hour and can only be used
            once. Request a new one and try again.
          </p>
        </div>

        <Button
          render={<Link href="/forgot-password" />}
          variant="default"
          className="w-full"
          size="lg"
          nativeButton={false}
        >
          Request a new link
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Set a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the new password for your account.
        </p>
      </div>

      <ResetPasswordForm token={token} />

      <p className="text-center text-sm text-muted-foreground">
        Changed your mind?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Back to log in
        </Link>
      </p>
    </div>
  )
}
