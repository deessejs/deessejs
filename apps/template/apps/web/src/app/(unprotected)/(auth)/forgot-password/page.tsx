import Link from "next/link"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

/**
 * Forgot password page. URL: /forgot-password.
 *
 * Server component shell: heading + subheading + the client-side form
 * (which handles its own "submitted" state and swaps to a confirmation
 * view in place). The two-column split lives in the parent
 * (auth)/layout.tsx.
 */
export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Forgot your password?
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the email associated with your account and we&rsquo;ll send
          you a reset link.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
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
