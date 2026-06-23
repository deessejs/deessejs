"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@deessejs/ui/components/button"
import { Input } from "@deessejs/ui/components/input"
import { Label } from "@deessejs/ui/components/label"

import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/auth-schemas"
import { requestPasswordReset } from "@/lib/auth-client"

/**
 * Forgot password form. Calls Better Auth's `/api/auth/forget-password`
 * via the client. The server is configured to ALWAYS return ok
 * regardless of whether the email exists (anti-énumération) — we
 * mirror that on the client by ignoring the `error` field and
 * always showing the confirmation view.
 *
 * `redirectTo` is where Better Auth sends the user after they click
 * the link in the email, with `?token=...` appended (or
 * `?error=INVALID_TOKEN` for an expired/used token). We point it at
 * `/reset-password` which handles both branches.
 *
 * After submit we swap to the confirmation view in place — the URL
 * stays at `/forgot-password` so the user can refresh or hit "Use
 * a different email" without losing context.
 */
export function ForgotPasswordForm() {
  const [submittedEmail, setSubmittedEmail] = React.useState<string | null>(
    null,
  )

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = async (values: ForgotPasswordInput) => {
    // Always ignore error: Better Auth intentionally returns 200 for
    // unknown emails. If the rate limit triggers (429), the user
    // will just see the confirmation view — acceptable degradation
    // for a best-effort flow.
    await requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    })
    setSubmittedEmail(values.email)
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = form

  if (submittedEmail !== null) {
    return (
      <div role="status" aria-live="polite" className="space-y-5">
        <div className="space-y-2">
          <div className="flex size-10 items-center justify-center rounded-full border border-border bg-muted text-foreground">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-5"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Check your inbox
          </h2>
          <p className="text-sm text-muted-foreground">
            If an account exists for{" "}
            <span className="font-medium text-foreground">
              {submittedEmail}
            </span>
            , we&rsquo;ve sent a password reset link. The link expires in
            1 hour.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => {
              reset({ email: "" })
              setSubmittedEmail(null)
            }}
          >
            Use a different email
          </Button>
          <Button
            render={<Link href="/login" />}
            className="w-full"
            size="lg"
            variant="ghost"
            nativeButton={false}
          >
            Back to log in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      aria-label="Request a password reset link"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={errors.email ? "true" : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <p id="email-error" className="text-xs text-destructive">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sending link…" : "Send reset link"}
      </Button>
    </form>
  )
}
