"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { ArrowLeft, CheckCircle2 } from "lucide-react"

import { Button } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import { Input } from "@workspace/ui/components/ui/input"
import { Label } from "@workspace/ui/components/ui/label"

/**
 * ForgotPasswordCard — auth flow for /forgot-password.
 *
 * Two states:
 *  1. Initial: email input + "Send reset link" button.
 *  2. Submitted: "Check your email" confirmation with the email echoed back
 *     and a "Try a different email" reset action.
 *
 * No backend wiring — submit is intercepted with preventDefault and the
 * success state is shown immediately. Production would call Better Auth
 * or a server action that emails a one-time reset token.
 */
export function ForgotPasswordCard() {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    // Simulate the request lifecycle so the UI feels real.
    window.setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
    }, 600)
  }

  function reset() {
    setSubmitted(false)
    setEmail("")
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CheckCircle2
            className="h-10 w-10 text-foreground"
            aria-hidden
          />
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            If an account exists for{" "}
            <span className="font-medium text-foreground">{email}</span>,
            we&apos;ve sent a password reset link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>The link expires in 1 hour.</p>
          <p>Check your spam folder if you don&apos;t see it.</p>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full"
            onClick={reset}
            nativeButton
          >
            Try a different email
          </Button>
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" aria-hidden />
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Forgot password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10"
            />
          </div>
          <Button
            type="submit"
            className="h-10 w-full"
            disabled={submitting}
            nativeButton
          >
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" aria-hidden />
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  )
}
