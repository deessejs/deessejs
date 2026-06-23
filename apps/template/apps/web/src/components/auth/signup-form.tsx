"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@deessejs/ui/components/button"
import { Input } from "@deessejs/ui/components/input"
import { Label } from "@deessejs/ui/components/label"

import { signupSchema, type SignupInput } from "@/lib/auth-schemas"
import { signUp } from "@/lib/auth-client"

/**
 * Signup form. Calls Better Auth's `/api/auth/sign-up/email`.
 *
 * With `requireEmailVerification: true` (in `packages/auth/src/auth.ts`),
 * sign-up returns 200 with no session — the user must click the link
 * in the verification email before they can sign in. We redirect to
 * `/verify-email?email=...` so the user knows what to do next.
 *
 * Error mapping (Better Auth `{ data, error }`):
 *   - 422 → validation error (rare with zodResolver on the client)
 *   - 429 → rate limit
 *   - other → fallback
 */
export function SignupForm() {
  const router = useRouter()
  const [serverError, setServerError] = React.useState<{
    message: string
    retryAfterSec?: number
  } | null>(null)

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (values: SignupInput) => {
    setServerError(null)
    const { error } = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      // Where Better Auth should send the user after they click the
      // verification link in the email. The /api/auth/verify-email
      // endpoint responds with a 302 to this URL on success, so the
      // browser lands here directly with the green "Email verified"
      // banner pre-rendered by the login page.
      callbackURL: "/login?verified=1",
    })

    if (error) {
      switch (error.status) {
        case 422:
          setServerError({
            message:
              "Some fields are invalid. Double-check the email format and password length (8+ characters).",
          })
          return
        case 429:
          setServerError({
            message: "Too many sign-up attempts. Please slow down and try again shortly.",
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

    // No session at this point (requireEmailVerification). Send to the
    // "check your inbox" page with the email so the resend button works.
    router.push(`/verify-email?email=${encodeURIComponent(values.email)}`)
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      aria-label="Create your account"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Ada Lovelace"
          aria-invalid={errors.name ? "true" : undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...register("name")}
        />
        {errors.name ? (
          <p id="name-error" className="text-xs text-destructive">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
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
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? "true" : undefined}
          aria-describedby={
            errors.password ? "password-error" : "password-hint"
          }
          {...register("password")}
        />
        {errors.password ? (
          <p id="password-error" className="text-xs text-destructive">
            {errors.password.message}
          </p>
        ) : (
          <p id="password-hint" className="text-xs text-muted-foreground">
            At least 8 characters.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? "true" : undefined}
          aria-describedby={
            errors.confirmPassword ? "confirm-error" : undefined
          }
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p id="confirm-error" className="text-xs text-destructive">
            {errors.confirmPassword.message}
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
        </div>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  )
}
