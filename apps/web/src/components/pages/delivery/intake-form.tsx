"use client"

import { useState, type FormEvent } from "react"
import { Controller, useForm } from "react-hook-form"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

/**
 * /delivery intake form.
 *
 * Five fields designed for technical buyers (CTO / VP Eng / staff
 * engineer). Validates client-side via Zod + react-hook-form.
 *
 * V1: dummy submit. The form surfaces a `role="status"` message
 * announcing that submission wires up in a later release
 * (Cal.com booking + email intake). When those wires land, swap
 * the `onSubmitEvent` handler for a `fetch()` call to
 * `/api/delivery` and open the calendar in a new tab via the
 * returned URL.
 */
const intakeSchema = z.object({
  name: z.string().min(1, "Your name is required."),
  email: z.string().email("Use a valid work email."),
  repo: z
    .string()
    .url("Paste a valid URL to your repo or current site."),
  base: z.enum(
    ["saas-multi-tenant", "e-commerce", "internal-portal", "top-of-funnel"],
    { message: "Pick the architecture closest to your project." },
  ),
  target: z.string().min(1, "Tell us the database and cloud you ship against."),
  deadline: z.enum(["under-2-weeks", "1-month", "flexible"], {
    message: "Pick a deadline horizon.",
  }),
})

type IntakeInput = z.infer<typeof intakeSchema>

export function IntakeForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IntakeInput>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      name: "",
      email: "",
      repo: "",
      target: "",
    },
  })

  const [submitted, setSubmitted] = useState(false)

  const onSubmit = () => {
    // V2: POST to /api/delivery, then open the Cal.com booking URL
    // returned by the server in a new tab. For now we just flag the
    // form as submitted so the helper line announces the wiring.
    setSubmitted(true)
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
      aria-label="Delivery intake"
    >
      <Field>
        <FieldLabel htmlFor="delivery-name">Name</FieldLabel>
        <Input
          id="delivery-name"
          autoComplete="name"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="delivery-email">Work email</FieldLabel>
        <Input
          id="delivery-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        <FieldError errors={[errors.email]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="delivery-repo">
          Link to your current site or repository
        </FieldLabel>
        <Input
          id="delivery-repo"
          type="url"
          inputMode="url"
          placeholder="https://github.com/your-org/your-app"
          aria-invalid={!!errors.repo}
          {...register("repo")}
        />
        <FieldDescription>
          GitHub, GitLab, or your live site. Anything that shows the
          current state.
        </FieldDescription>
        <FieldError errors={[errors.repo]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="delivery-base">
          Which template or architecture is the base of the project?
        </FieldLabel>
        <Controller
          control={control}
          name="base"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="delivery-base" aria-invalid={!!errors.base}>
                <SelectValue placeholder="Select an architecture…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saas-multi-tenant">SaaS multi-tenant</SelectItem>
                <SelectItem value="e-commerce">E-commerce</SelectItem>
                <SelectItem value="internal-portal">Internal portal</SelectItem>
                <SelectItem value="top-of-funnel">Top-of-funnel site</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <FieldError errors={[errors.base]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="delivery-target">
          Target database and cloud
        </FieldLabel>
        <Input
          id="delivery-target"
          placeholder="Postgres / Neon, AWS, Cloudflare…"
          aria-invalid={!!errors.target}
          {...register("target")}
        />
        <FieldError errors={[errors.target]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="delivery-deadline">
          Production deadline
        </FieldLabel>
        <Controller
          control={control}
          name="deadline"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="delivery-deadline"
                aria-invalid={!!errors.deadline}
              >
                <SelectValue placeholder="Pick a horizon…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under-2-weeks">Under 2 weeks</SelectItem>
                <SelectItem value="1-month">1 month</SelectItem>
                <SelectItem value="flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <FieldError errors={[errors.deadline]} />
      </Field>

      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p
          className="max-w-sm text-copy-13 leading-5 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {submitted
            ? "Form wiring lands in a later release. Your details are not stored yet. Email support@deessejs.com for now."
            : "Submitting will open an Engineering Calendar to pick a 20-minute technical scoping call."}
        </p>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="shrink-0 sm:self-auto self-start"
        >
          {isSubmitting ? "Submitting…" : "Submit & Book Engineering Call (20 min)"}
        </Button>
      </div>
    </form>
  )
}
