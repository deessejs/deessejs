"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@deessejs/ui/components/button"
import { Input } from "@deessejs/ui/components/input"
import { Label } from "@deessejs/ui/components/label"

import { loginSchema, type LoginInput } from "@/lib/auth-schemas"
import { signIn } from "@/lib/auth-client"

/**
 * Login form. Calls Better Auth's `/api/auth/sign-in/email` via the
 * React client. M2+ will use the oRPC `/rpc/auth.signIn` procedure
 * once we add the public auth contract — same UX, but typed.
 *
 * Error mapping (Better Auth returns `{ data, error }` where `error`
 * has `status`, `code`, `message`):
 *   - 401 → bad credentials
 *   - 403 → email not verified (requireEmailVerification: true)
 *   - 429 → rate limit (X-Retry-After header)
 *   - other → fallback
 *
 * On success: `router.push(redirectTo ?? "/dashboard")`. The `redirectTo`
 * is passed by the page when the user was sent to /login from a
 * protected route.
 */
export function LoginForm({
  redirectTo,
  showResetSuccess = false,
  showVerifiedSuccess = false,
}: {
  /** Where to send the user on successful login. Default `/dashboard`. */
  redirectTo?: string
  /** Show a success banner (e.g. after password reset). */
  showResetSuccess?: boolean
  /** Show a "Email verified" banner (after clicking the link in the email). */
  showVerifiedSuccess?: boolean
}) {
  const router = useRouter()
  const [serverError, setServerError] = React.useState<{
    message: string
    retryAfterSec?: number
    needsVerification?: boolean
    email?: string
  } | null>(null)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: LoginInput) => {
    setServerError(null)
    const { error } = await signIn.email({
      email: values.email,
      password: values.password,
    })

    if (error) {
      switch (error.status) {
        case 401:
          setServerError({ message: "Invalid email or password." })
          return
        case 403:
          // requireEmailVerification: true. Resend trigger below.
          setServerError({
            message:
              "Please verify your email address before signing in. Check your inbox for the link we sent.",
            needsVerification: true,
            email: values.email,
          })
          return
        case 429:
          setServerError({
            message: "Too many sign-in attempts. Please slow down and try again shortly.",
            retryAfterSec: 60,
          })
          return
        default:
          setServerError({
            message: error.message || "Something went wrong. Try again.",
          })
          return
      }
    }

    router.push(redirectTo ?? "/dashboard")
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  return (
    <div className="space-y-4">
      {showResetSuccess ? (
        <div
          role="status"
          className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300"
        >
          Password reset successfully. Please sign in with your new password.
        </div>
      ) : null}

      {showVerifiedSuccess ? (
        <div
          role="status"
          className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300"
        >
          Email verified! You can now sign in.
        </div>
      ) : null}

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        aria-label="Log in to your account"
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? "true" : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          {errors.password ? (
            <p id="password-error" className="text-xs text-destructive">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        {serverError ? (
          <div
            role="alert"
            className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
          >
            <p>{serverError.message}</p>
            {serverError.retryAfterSec ? (
              <p className="text-muted-foreground">
                Retry in about {serverError.retryAfterSec} seconds.
              </p>
            ) : null}
            {serverError.needsVerification && serverError.email ? (
              <p>
                <Link
                  href={`/verify-email?email=${encodeURIComponent(serverError.email)}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  Resend verification email
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  )
}
