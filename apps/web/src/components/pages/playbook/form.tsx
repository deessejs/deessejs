"use client"

import { ORPCError } from "@orpc/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRef, type FormEvent } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import Link from "next/link"
import { orpc } from "@/lib/orpc"

/**
 * /playbook signup form.
 *
 * Single email field + optional consent checkbox. Submit posts to
 * the `orpc.playbook.signup` procedure; success surfaces a Sonner
 * toast (`Toaster` is mounted globally in `apps/web/src/app/layout.tsx`).
 *
 * Form-shape decisions:
 *
 *   - One field only: the brief is explicit that the workbook is the
 *     requested service, so the only thing the visitor *must* give
 *     up to receive the PDF is an email. NN/g's web-form research
 *     holds that asking for unnecessary fields reduces conversion.
 *   - The consent checkbox is unchecked by default. EU GDPR/CNIL
 *     requires explicit, specific, freely-revocable opt-in for
 *     promotional emails — a pre-checked box would invert the
 *     consent polarity and defeat the audit trail downstream
 *     (Resend Audiences).
 *   - The privacy text block sits directly under the checkbox so
 *     the reader sees what data collection happens before they
 *     check it.
 *
 * Controlled-Checkbox + RHF note:
 *
 * No controlled `Checkbox` + `react-hook-form` pattern exists in
 * the repo today (`Checkbox` is only used uncontrolled in
 * `apps/app/components/auth/login-form.tsx`). The `Controller`
 * wiring below mirrors the existing `Select` pattern from
 * `apps/web/src/components/pages/delivery/intake-form.tsx`. A
 * future second caller should consolidate this into a shared
 * primitive inside `@workspace/ui` per DESIGN.md §1.5.
 */
const playbookSchema = z.object({
  email: z.string().email("Use a valid email address."),
  consentMarketing: z.boolean(),
})

type PlaybookInput = z.infer<typeof playbookSchema>

export function Form() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlaybookInput>({
    resolver: zodResolver(playbookSchema),
    defaultValues: {
      email: "",
      consentMarketing: false,
    },
  })

  // Tracks an already-shown "duplicate" so we don't fire the same
  // success toast twice if the user clicks Submit again within the
  // 60s dedup window. Server returns 409 either way; we treat
  // both occurrences as success because the first one already
  // delivered the email. Used only inside the submit handlers
  // (set + read both happen there), so useRef rather than
  // useState — there is no UI that needs to re-render when it
  // flips. Triggers the `rerender-state-only-in-handlers`
  // React Doctor lint if it stays as state.
  const deliveredRef = useRef(false)

  const onSubmit = async (data: PlaybookInput) => {
    try {
      const { ok } = await orpc.playbook.signup({
        email: data.email,
        consentMarketing: data.consentMarketing,
      })
      if (ok) {
        deliveredRef.current = true
        toast.success("Check your inbox — the PDF is on the way.")
      }
    } catch (err) {
      if (err instanceof ORPCError) {
        if (err.code === "DUPLICATE_SIGNUP") {
          // Same outcome as success: the email was already sent.
          // Show the same green toast; no need for a destructive one.
          if (!deliveredRef.current) {
            deliveredRef.current = true
            toast.success("Check your inbox — the PDF is on the way.")
          }
          return
        }
        if (err.code === "RATE_LIMITED") {
          toast.error(
            "You've sent a few signups recently. Please wait a minute and try again.",
          )
          return
        }
        if (err.code === "EMAIL_SEND_FAILED") {
          toast.error(
            "Couldn't send the email right now. Try again in a few minutes or email support@deessejs.com.",
          )
          return
        }
        if (err.code === "BAD_REQUEST" || err.code === "INVALID_EMAIL") {
          toast.error("That email looks off — please double-check it.")
          return
        }
      }
      toast.error(
        "Something went wrong. Try again, or email support@deessejs.com.",
      )
    }
  }

  const onSubmitEvent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleSubmit(onSubmit)(event)
  }

  return (
    <form
      onSubmit={onSubmitEvent}
      noValidate
      className="flex w-full max-w-md flex-col gap-5"
      aria-label="Playbook signup"
    >
      <Field>
        <FieldLabel htmlFor="playbook-email">Email address</FieldLabel>
        <Input
          id="playbook-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        <FieldError errors={[errors.email]} />
      </Field>

      <Field>
        <div className="flex items-start gap-3">
          <Controller
            control={control}
            name="consentMarketing"
            render={({ field }) => (
              <Checkbox
                id="playbook-consent"
                aria-invalid={!!errors.consentMarketing}
                checked={field.value === true}
                onCheckedChange={(value) =>
                  field.onChange(value === true)
                }
                className="mt-1"
              />
            )}
          />
          <FieldLabel
            htmlFor="playbook-consent"
            className="cursor-pointer text-copy-14 font-normal leading-6 text-foreground"
          >
            I want occasional updates about DeesseJS and offers
            relevant to the topic. Unsubscribe anytime.
          </FieldLabel>
        </div>
        <FieldDescription>
          We use your email to send the playbook. If you opt in to
          updates, your contact is added to our Resend Audience, where
          you can update your preferences or unsubscribe at any time.
          We don&apos;t share your address with third parties. Read our{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            privacy policy
          </Link>{" "}
          for retention and contact details.
        </FieldDescription>
        <FieldError errors={[errors.consentMarketing]} />
      </Field>

      <Button type="submit" disabled={isSubmitting} size="lg">
        {isSubmitting ? "Sending…" : "Get the free playbook"}
      </Button>
    </form>
  )
}
