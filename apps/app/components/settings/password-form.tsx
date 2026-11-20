"use client"

import { client } from "@/lib/client"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { PasswordInput } from "@/components/auth/password-input"
import { useForm } from "@tanstack/react-form"

export function PasswordForm() {
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      if (value.newPassword !== value.confirmPassword) {
        toast.error("Passwords do not match")
        return
      }

      if (value.newPassword.length < 8) {
        toast.error("Password must be at least 8 characters")
        return
      }

      setSubmitting(true)
      const { error } = await client.auth.changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
      })
      setSubmitting(false)

      if (error) {
        toast.error(error.message ?? "Failed to update password")
        return
      }

      setSaved(true)
      form.reset()
      setTimeout(() => setSaved(false), 3000)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className="flex flex-col gap-4"
    >
      {saved && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Password updated.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="current" className="text-sm font-medium">
          Current password
        </label>
        <form.Field name="currentPassword">
          {(field) => (
            <PasswordInput
              id="current"
              name="current"
              autoComplete="current-password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="new" className="text-sm font-medium">
          New password
        </label>
        <form.Field name="newPassword">
          {(field) => (
            <PasswordInput
              id="new"
              name="new"
              autoComplete="new-password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm" className="text-sm font-medium">
          Confirm new password
        </label>
        <form.Field name="confirmPassword">
          {(field) => (
            <PasswordInput
              id="confirm"
              name="confirm"
              autoComplete="new-password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Updating…" : "Update password"}
        </Button>
      </div>
    </form>
  )
}
