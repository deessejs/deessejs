"use client"

import * as React from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"

/**
 * Open-source license application form. Visual-only for now: the
 * submit button is disabled and `onSubmit` does nothing. The actual
 * submission logic (Resend, oRPC, or direct DB write) will be wired
 * in a follow-up. The shape of the payload (`FormValues`) is the
 * canonical source for the eventual API contract.
 *
 * Kept as a thin client component so the rest of the page can stay
 * a server component (FlickeringGrid, Section, etc.). Submit logic
 * will live here when wired.
 */

type FormValues = {
  repoUrl: string
  projectName: string
  description: string
  handle: string
  contactEmail: string
}

const FIELDS: Array<{
  name: keyof FormValues
  label: string
  type: "input" | "textarea"
  inputType?: "text" | "email" | "url"
  placeholder: string
  required: boolean
  rows?: number
}> = [
  {
    name: "repoUrl",
    label: "Repository URL",
    type: "input",
    inputType: "url",
    placeholder: "https://github.com/your-org/your-project",
    required: true,
  },
  {
    name: "projectName",
    label: "Project name",
    type: "input",
    inputType: "text",
    placeholder: "your-project",
    required: true,
  },
  {
    name: "description",
    label: "One-sentence description",
    type: "textarea",
    placeholder: "What does the project do?",
    required: true,
    rows: 3,
  },
  {
    name: "handle",
    label: "GitHub or GitLab username",
    type: "input",
    inputType: "text",
    placeholder: "@your-handle",
    required: true,
  },
  {
    name: "contactEmail",
    label: "Contact email",
    type: "input",
    inputType: "email",
    placeholder: "you@example.com",
    required: true,
  },
] as const

export function OssApplicationForm() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // Visual-only: prevents the page navigation that a default
    // submit would trigger. Real implementation will POST the payload
    // to an oRPC endpoint or a Resend webhook.
    event.preventDefault()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
      aria-label="Open source license application"
    >
      {FIELDS.map((field) => (
        <div
          key={field.name}
          className="flex flex-col gap-2"
        >
          <Label htmlFor={`oss-${field.name}`}>
            {field.label}
            {field.required ? (
              <span
                aria-hidden
                className="ml-1 text-muted-foreground"
              >
                *
              </span>
            ) : null}
          </Label>
          {field.type === "textarea" ? (
            <Textarea
              id={`oss-${field.name}`}
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              rows={field.rows}
              className="min-h-20"
            />
          ) : (
            <Input
              id={`oss-${field.name}`}
              name={field.name}
              type={field.inputType}
              placeholder={field.placeholder}
              required={field.required}
            />
          )}
        </div>
      ))}

      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-copy-13 text-muted-foreground">
          Reply within five business days. License file scoped to the
          project.
        </p>
        <Button
          type="submit"
          size="lg"
          // Visual-only for now. When the submit pipeline is wired
          // (oRPC + Resend + DB write), drop `disabled` and let the
          // client component manage submitting / success / error state.
          disabled
        >
          Submit application
        </Button>
      </div>
    </form>
  )
}