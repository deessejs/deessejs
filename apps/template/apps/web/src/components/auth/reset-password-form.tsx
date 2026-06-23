"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@deessejs/ui/components/button"
import { Input } from "@deessejs/ui/components/input"
import { Label } from "@deessejs/ui/components/label"

import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/auth-schemas"
import { resetPassword } from "@/lib/auth-client"

/**
 * Reset password form. Calls Better Auth's `/api/auth/reset-password`
 * with `{ newPassword, token }`. The token comes from the URL query
 * string (`?token=...` appended by Better Auth when the user clicks
 * the link in the password-reset email).
 *
 * On success: redirect to `/login?reset=success` so the login page
 * can flash a "Password reset successfully" banner.
 *
 * Error mapping:
 *   - 400 → invalid/expired token (also: defensive in case the user
 *           lands here with a stale URL after consuming the token)
 *   - 422 → password didn't meet policy (rare with zodResolver on client)
 *   - 429 → rate limit
 *   - other → fallback
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [serverError, setServerError] = React.useState<{
    message: string
    retryAfterSec?: number
  } | null>(null)

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })

  const onSubmit = async (values: ResetPasswordInput) => {
    setServerError(null)
    const { error } = await resetPassword({
      newPassword: values.newPassword,
      token,
    })

    if (error) {
      switch (error.status) {
        case 400:
          // Token invalid, expired, or already consumed. Send the user
          // back to the request-new-link screen rather than showing
          // a stale error inline.
          router.push("/reset-password?error=INVALID_TOKEN")
          return
        case 422:
          setServerError({
            message:
              "Password doesn't meet the policy. Use 8+ characters.",
          })
          return
        case 429:
          setServerError({
            message: "Too many attempts. Please slow down and try again shortly.",
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

    router.push("/login?reset=success")
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
      aria-label="Set a new password"
    >
      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.newPassword ? "true" : undefined}
          aria-describedby={
            errors.newPassword ? "new-password-error" : "new-password-hint"
          }
          {...register("newPassword")}
        />
        {errors.newPassword ? (
          <p id="new-password-error" className="text-xs text-destructive">
            {errors.newPassword.message}
          </p>
        ) : (
          <p id="new-password-hint" className="text-xs text-muted-foreground">
            At least 8 characters.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? "true" : undefined}
          aria-describedby={
            errors.confirmPassword ? "confirm-password-error" : undefined
          }
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p id="confirm-password-error" className="text-xs text-destructive">
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
        {isSubmitting ? "Updating password…" : "Update password"}
      </Button>
    </form>
  )
}
