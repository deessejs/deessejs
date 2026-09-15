"use client"

import { useState, type FormEvent } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

const RECIPIENT = "support@deessejs.com"

/**
 * Enterprise inquiry schema. The four fields map to the smallest
 * capture the sales team needs to route the inquiry: who is asking,
 * where they work, and what they want to build. Company size and
 * project budget are intentionally deferred to the follow-up email
 * — progressive disclosure per B2B research (saasui.design, 2026).
 *
 * `message` requires a minimum of twenty characters so the team has
 * enough context to triage; longer bodies are fine and welcomed.
 */
const enterpriseInquirySchema = z.object({
  name: z.string().min(1, "Your name is required."),
  email: z.string().email("Use a valid work email."),
  company: z.string().min(1, "Company is required."),
  message: z
    .string()
    .min(20, "A sentence or two helps us route your inquiry faster."),
})

type EnterpriseInquiryInput = z.infer<typeof enterpriseInquirySchema>

/**
 * Enterprise inquiry form.
 *
 * Submits via `mailto:` to avoid standing up a backend route before
 * the sales team has agreed on a workflow. When a real endpoint
 * exists (e.g. `/api/enterprise`), swap the submit handler for a
 * `fetch()` call without touching the field layout.
 *
 * Validation runs client-side via Zod + react-hook-form. Errors
 * surface under each field via the shadcn `FieldError` primitive,
 * which auto-wires `role="alert"` and `aria-describedby` for screen
 * readers. The submit button stays disabled while the form is
 * submitting and the helper line announces the mailto handoff once
 * validation passes.
 */
export function EnterpriseForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EnterpriseInquiryInput>({
    resolver: zodResolver(enterpriseInquirySchema),
    defaultValues: { name: "", email: "", company: "", message: "" },
  })

  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const onSubmit = (data: EnterpriseInquiryInput) => {
    const subject = `Enterprise inquiry from ${data.company || data.name || "DeesseJS visitor"}`
    const body = [
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Company: ${data.company}`,
      "",
      "Message:",
      data.message,
      "",
      "—",
      "Sent from the DeesseJS /enterprise page.",
    ].join("\n")

    setSubmittedEmail(data.email)

    // Trigger the mail client last so the React state update is
    // committed before the navigation. window.location.href is the
    // standard pattern — a temporary anchor click also works but
    // requires appending the element to the DOM.
    window.location.href =
      `mailto:${RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const onSubmitEvent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleSubmit(onSubmit)(event)
  }

  return (
    <form
      onSubmit={onSubmitEvent}
      noValidate
      className="flex flex-col gap-5"
      aria-label="Enterprise inquiry"
    >
      <Field>
        <FieldLabel htmlFor="enterprise-name">Name</FieldLabel>
        <Input
          id="enterprise-name"
          autoComplete="name"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="enterprise-email">Work email</FieldLabel>
        <Input
          id="enterprise-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        <FieldError errors={[errors.email]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="enterprise-company">Company</FieldLabel>
        <Input
          id="enterprise-company"
          autoComplete="organization"
          aria-invalid={!!errors.company}
          {...register("company")}
        />
        <FieldError errors={[errors.company]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="enterprise-message">What are you building?</FieldLabel>
        <Textarea
          id="enterprise-message"
          rows={5}
          aria-invalid={!!errors.message}
          {...register("message")}
        />
        <FieldDescription>
          One or two sentences is enough. We follow up to scope the engagement.
        </FieldDescription>
        <FieldError errors={[errors.message]} />
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className="text-copy-13 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {submittedEmail
            ? `Opening your mail client addressed to ${RECIPIENT}. We reply within two business days.`
            : `Submitting opens your mail client addressed to ${RECIPIENT}. We reply within two business days.`}
        </p>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Opening mail client…" : "Email us about Enterprise"}
        </Button>
      </div>
    </form>
  )
}
