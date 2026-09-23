import Link from "next/link"
import { ShieldCheck, Wrench } from "lucide-react"

import {
  PERSONA_ROUTES,
  type PersonaRoute,
} from "@/lib/enterprise/persona-routes"

const PERSONA_ICONS = {
  "shield-check": ShieldCheck,
  wrench: Wrench,
} as const

/**
 * Persona routing for the /enterprise page.
 *
 * Engineering leadership reads first — they decide whether the
 * templates fit their stack and whether the engagement model fits
 * their team. Procurement and security reads second — they need
 * to know that paperwork does not block delivery. Engineering-first
 * matches the "evaluate, then sign" rhythm of B2B SaaS buying
 * committees (Gartner 2026, getspike.ai).
 */
export function Personas() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
      {PERSONA_ROUTES.map((persona) => (
        <PersonaCell key={persona.label} persona={persona} />
      ))}
    </div>
  )
}

function PersonaCell({ persona }: { persona: PersonaRoute }) {
  const Icon = PERSONA_ICONS[persona.icon]
  return (
    <div className="flex flex-col gap-4 p-6 lg:p-10">
      <header className="flex items-center gap-2 text-label-13 uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {persona.label}
      </header>
      <h3 className="text-heading-24 tracking-tight text-foreground text-balance [&:not(:first-child)]:mt-0">
        {persona.title}
      </h3>
      <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
        {persona.body}
      </p>
      <div className="pt-1">
        <Link
          href={persona.href}
          className="inline-flex items-center gap-1 text-label-13 text-foreground underline-offset-4 hover:underline"
        >
          {persona.ctaLabel}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  )
}
