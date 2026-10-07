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
 * Enterprise inquiry form, embedded in the pricing page's
 * EnterpriseReady section.
 *
 * IMPORTANT: this component intentionally duplicates
 * `apps/web/src/app/(company)/enterprise/enterprise-form.tsx`
 * rather than importing it. The two live in different layout
 * contexts (a wide inquiry column on /enterprise vs. a stacked
 * 2-col on /pricing) and the cost of a shared component is
 * low. The duplication keeps each surface self-contained: copy
 * and validation rules can evolve independently without
 * breaking the other. If a third consumer appears, promote to
 * a shared module.
 *
 * Mailto submit is the same on both surfaces (Zod validation +
 * `mailto:` handoff). When a real `/api/enterprise` endpoint
 * exists, swap both implementations in lockstep.
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

export function EnterpriseInquiryForm() {
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
      "Sent from the DeesseJS /pricing Enterprise-ready block.",
    ].join("\n")

    setSubmittedEmail(data.email)

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
        <FieldLabel htmlFor="pricing-enterprise-name">Name</FieldLabel>
        <Input
          id="pricing-enterprise-name"
          autoComplete="name"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="pricing-enterprise-email">Work email</FieldLabel>
        <Input
          id="pricing-enterprise-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        <FieldError errors={[errors.email]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="pricing-enterprise-company">Company</FieldLabel>
        <Input
          id="pricing-enterprise-company"
          autoComplete="organization"
          aria-invalid={!!errors.company}
          {...register("company")}
        />
        <FieldError errors={[errors.company]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="pricing-enterprise-message">
          What are you building?
        </FieldLabel>
        <Textarea
          id="pricing-enterprise-message"
          rows={5}
          aria-invalid={!!errors.message}
          {...register("message")}
        />
        <FieldDescription>
          One or two sentences is enough. We follow up to scope the engagement.
        </FieldDescription>
        <FieldError errors={[errors.message]} />
      </Field>

      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p
          className="max-w-sm text-copy-13 leading-5 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {submittedEmail
            ? `Opening your mail client addressed to ${RECIPIENT}. We reply within two business days.`
            : `Submitting opens your mail client addressed to ${RECIPIENT}. We reply within two business days.`}
        </p>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="shrink-0 sm:self-auto self-start"
        >
          {isSubmitting ? "Opening mail client…" : "Email us about Enterprise"}
        </Button>
      </div>
    </form>
  )
}
