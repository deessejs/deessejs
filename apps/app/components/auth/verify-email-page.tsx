"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
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
    const email = searchParams.get("email")
    if (email) {
      await authClient.sendVerificationEmail({ email })
    }
    setResending(false)
    setResent(true)
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
