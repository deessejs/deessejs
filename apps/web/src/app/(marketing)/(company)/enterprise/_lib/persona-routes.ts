/**
 * Persona routing for the /enterprise page.
 *
 * Engineering leadership reads first — they decide whether the
 * templates fit their stack and whether the engagement model fits
 * their team. Procurement and security reads second — they need
 * to know that paperwork does not block delivery. Engineering-first
 * matches the "evaluate, then sign" rhythm of B2B SaaS buying
 * committees (Gartner 2026, getspike.ai).
 *
 * The same two-card pattern is reused on multiple marketing pages;
 * here it lets both roles find their own path without splitting
 * /enterprise into two routes.
 */
export type PersonaRoute = {
  /** Lucide icon slug. Resolved at render time on the client. */
  icon: "shield-check" | "wrench"
  /** Short uppercase-ish label above the heading. */
  label: string
  title: string
  body: string
  /** Internal route or external link. */
  href: string
  /** Anchor label, verb + noun. */
  ctaLabel: string
}

export const PERSONA_ROUTES: ReadonlyArray<PersonaRoute> = [
  {
    icon: "wrench",
    label: "For engineering leadership",
    title: "Cut the build from months to weeks.",
    body: "A senior engineer joins your channel for the engagement. Weekly syncs, code review on every template shipped, architecture choices explained. The handover is a clean codebase, not a wiki.",
    href: "mailto:support@deessejs.com?subject=Engineering%20intro%20call",
    ctaLabel: "Book an engineering intro",
  },
  {
    icon: "shield-check",
    label: "For procurement and security",
    title: "Paperwork returned in five business days.",
    body: "Signed DPAs, security questionnaires, vendor onboarding forms completed by our team. Procurement runs in parallel with delivery, not before it.",
    href: "mailto:support@deessejs.com?subject=Security%20pack%20request",
    ctaLabel: "Request the security pack",
  },
]
