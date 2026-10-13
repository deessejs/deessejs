"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { safeRedirect } from "@workspace/utils/safe-redirect"
import { Button } from "@workspace/ui/components/button"
import { MailIcon } from "lucide-react"

export function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPageContent />
    </Suspense>
  )
}

function VerifyEmailPageContent() {
  const searchParams = useSearchParams()
  const [resent, setResent] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleResend() {
    setResending(true)
    setResent(false)
    const email = searchParams.get("email")
    // The signup form stores the redirect value as-is
    // (`URLSearchParams.set` already percent-encodes it once,
    // and a second pass via `encodeURIComponent` would
    // produce a double-encoded path that breaks the magic
    // link destination). `searchParams.get` returns the
    // decoded form. Normalize it through `safeRedirect` —
    // the same helper the login form uses — to reject
    // protocol-relative URLs and backslash variants before
    // it reaches `sendVerificationEmail`'s `callbackURL`.
    const redirect = safeRedirect(searchParams.get("redirect"))
    if (!email) {
      // Without an email we cannot call
      // `sendVerificationEmail`. The signup form forwards
      // `?email=`; if it's missing the user likely landed
      // here via a stale link. Surface a clear error and
      // leave the button in its idle state so the user
      // can re-trigger the sign-up flow rather than
      // seeing a false-positive "Email sent".
      setResending(false)
      toast.error(
        "Missing email — return to sign-up to request a new verification link.",
      )
      return
    }
    try {
      // The resend uses the same `callbackURL` so a
      // click on the freshly-sent link lands on the
      // original destination (e.g. the invited
      // organization).
      const { error } = await authClient.sendVerificationEmail({
        email,
        ...(redirect ? { callbackURL: redirect } : {}),
      })
      if (error) {
        toast.error(error.message ?? "Could not resend verification email")
        return
      }
      setResent(true)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not resend verification email",
      )
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a verification link to your email address.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-lg border p-6">
        <div className="flex size-12 items-center justify-center rounded-full border bg-muted">
          <MailIcon className="size-5 text-muted-foreground" />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Click the link in the email we sent you to verify your account.
          The link expires in 24 hours.
        </p>
      </div>

      <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
        <p>Didn&apos;t receive the email?</p>
        <Button
          variant="outline"
          size="sm"
          className="self-center"
          disabled={resending}
          onClick={handleResend}
        >
          {resending ? "Sending…" : resent ? "Email sent" : "Resend verification email"}
        </Button>
      </div>
    </div>
  )
}
