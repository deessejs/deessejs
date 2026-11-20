"use client"

import { client } from "@/lib/client"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { safeRedirect } from "@workspace/utils/safe-redirect"
import { useForm } from "@tanstack/react-form"

export function EmailForm() {
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      if (!value.email.trim()) return
      setSubmitting(true)
      const { error } = await client.auth.sendVerificationEmail({
        email: value.email.trim(),
        callbackURL: safeRedirect("/verify-email"),
      })
      setSubmitting(false)
      if (error) {
        toast.error(error.message ?? "Failed to send verification email")
        return
      }
      setSent(true)
    },
  })

  if (sent) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
        <p className="font-medium">Verification email sent</p>
        <p>Check your new email inbox to confirm the change.</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium">
          New email
        </label>
        <form.Field name="email">
          {(field) => (
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="new@example.com"
              autoComplete="email"
              required
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={submitting || !form.state.values.email.trim()}
        >
          {submitting ? "Sending…" : "Send verification"}
        </Button>
      </div>
    </form>
  )
}
