"use client"

import * as React from "react"

import { Button } from "@deessejs/ui/components/button"

import { sendVerificationEmail } from "@/lib/auth-client"

/**
 * Resend button for the "check your inbox" page. Calls Better Auth's
 * `sendVerificationEmail`, which re-fires the `sendVerificationEmail`
 * hook in `packages/auth/src/auth.ts` (i.e. `void sendMail(...)` →
 * ConsoleMailer in dev, ResendMailer in prod).
 *
 * The `callbackURL` is what Better Auth redirects to after the user
 * clicks the link in the email. We point it at `/login?verified=1`
 * so the login page can flash a "Email verified" banner.
 */
export function ResendVerificationButton({ email }: { email: string }) {
  const [state, setState] = React.useState<
    | { kind: "idle" }
    | { kind: "sending" }
    | { kind: "sent" }
    | { kind: "error"; message: string }
  >({ kind: "idle" })

  const onClick = async () => {
    setState({ kind: "sending" })
    const { error } = await sendVerificationEmail({
      email,
      callbackURL: "/login?verified=1",
    })
    if (error) {
      setState({
        kind: "error",
        message: error.message || "Could not resend. Try again in a moment.",
      })
      return
    }
    setState({ kind: "sent" })
  }

  if (state.kind === "sent") {
    return (
      <p
        role="status"
        className="text-sm text-emerald-700 dark:text-emerald-300"
      >
        Verification email re-sent. Check your inbox (and your dev server
        console if you&rsquo;re running locally).
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        size="lg"
        onClick={onClick}
        disabled={state.kind === "sending"}
      >
        {state.kind === "sending" ? "Sending…" : "Resend verification email"}
      </Button>
      {state.kind === "error" ? (
        <p role="alert" className="text-xs text-destructive">
          {state.message}
        </p>
      ) : null}
    </div>
  )
}
