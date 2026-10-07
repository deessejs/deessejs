/**
 * Trust and compliance data for the /enterprise page.
 *
 * Documenting processes, not certifications. SOC 2 Type II and ISO
 * 27001 are not listed because no audit has been completed yet —
 * adding them now would be a fabricated trust signal, which the
 * design system forbids (DESIGN.md §6). When a real report exists,
 * the auditor (Drata, Vanta, or an accredited CB) supplies the
 * badge with its own usage terms. Until then, the section describes
 * what the team actually does on request, with response times.
 *
 * Source code ownership is a product characteristic, not a
 * compliance commitment, so it lives in the proof points grid
 * instead.
 */
export type TrustBadge = {
  /** Short label, sentence case. */
  label: string
  /** What the buyer can request. One sentence. */
  detail: string
  /** Where the buyer can request or verify it. */
  href: string
}

export const TRUST_BADGES: ReadonlyArray<TrustBadge> = [
  {
    label: "DPAs on request",
    detail: "Standard template ready to sign. Custom terms fast-tracked.",
    href: "mailto:support@deessejs.com?subject=DPA%20request",
  },
  {
    label: "Security questionnaires",
    detail: "Turnaround in under 5 business days. No legalese, no redirect to a portal.",
    href: "mailto:support@deessejs.com?subject=Security%20questionnaire",
  },
  {
    label: "Mutual NDA on first contact",
    detail: "Send yours. We countersign within one business day, before the intro call.",
    href: "mailto:support@deessejs.com?subject=NDA",
  },
]
