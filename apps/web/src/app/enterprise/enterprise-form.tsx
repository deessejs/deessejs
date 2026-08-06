"use client"

import { useState, type ChangeEvent, type FormEvent } from "react"

import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

type FormState = {
  name: string
  email: string
  company: string
  size: string
  message: string
}

const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-1000",
  "1000+",
] as const

const RECIPIENT = "support@deessejs.com"

/**
 * Enterprise inquiry form. Opens the visitor's mail client with a
 * pre-filled subject and body (mailto + mailto body). No backend, no
 * token, no spam vector to defend. When a real route is wired (e.g.
 * /api/enterprise), the submit handler below can swap the mailto for
 * a fetch call without touching the field layout.
 *
 * Fields are kept minimal on purpose: name, email, company, size,
 * message. Anything more qualitative belongs in a follow-up email,
 * not in a form a visitor is reluctant to fill out.
 */
export function EnterpriseForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    company: "",
    size: "",
    message: "",
  })

  const update =
    (key: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }))
    }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const subject = `Enterprise inquiry from ${form.company || form.name || "DeesseJS visitor"}`
    const body = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Company: ${form.company}`,
      `Company size: ${form.size}`,
      "",
      "Message:",
      form.message,
      "",
      "—",
      "Sent from the DeesseJS /enterprise page.",
    ].join("\n")
    const href = `mailto:${RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = href
  }

  return (
    <Card className="flex flex-col gap-6 p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="enterprise-name" className="text-label-13 font-medium text-foreground">
              Name
            </label>
            <Input
              id="enterprise-name"
              name="name"
              autoComplete="name"
              required
              value={form.name}
              onChange={update("name")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="enterprise-email" className="text-label-13 font-medium text-foreground">
              Email
            </label>
            <Input
              id="enterprise-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={update("email")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="enterprise-company" className="text-label-13 font-medium text-foreground">
              Company
            </label>
            <Input
              id="enterprise-company"
              name="company"
              autoComplete="organization"
              required
              value={form.company}
              onChange={update("company")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="enterprise-size" className="text-label-13 font-medium text-foreground">
              Company size
            </label>
            <Select
              value={form.size}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, size: value }))
              }
              name="size"
            >
              <SelectTrigger id="enterprise-size">
                <SelectValue placeholder="Select a size" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="enterprise-message" className="text-label-13 font-medium text-foreground">
            What are you building?
          </label>
          <Textarea
            id="enterprise-message"
            name="message"
            rows={5}
            required
            value={form.message}
            onChange={update("message")}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-copy-13 text-muted-foreground">
            Submitting opens your mail client addressed to {RECIPIENT}.
            We reply within two business days.
          </p>
          <Button type="submit">Email us about Enterprise</Button>
        </div>
      </form>
    </Card>
  )
}
