/**
 * Enterprise page namespace — single import surface for every
 * section on `/enterprise`.
 *
 * Mirrors the pattern established by `@/components/pages/homepage`
 * and `@/components/pages/pricing`: the route file imports
 * `Enterprise` and renders each section as `<Enterprise.X />`,
 * becoming a literal table of contents.
 *
 * Sections, top to bottom:
 *   - JsonLd        — ContactPage + FAQPage schema (mounted first)
 *   - Hero          — single-column proposition
 *   - Trust         — 3-cell verifiable claims
 *   - Personas      — engineering leadership / procurement & security
 *   - ProofPoints   — 2x2 capability grid
 *   - Process       — 3-step timeline
 *   - Inquiry       — 2-col intro + sticky form
 *   - FAQ           — accordion (FAQPage mainEntity derived from same data)
 *   - FinalCta      — last 2-col block (talk to delivery)
 *
 * No `RelatedLinks` section. The previous version linked to
 * `/pricing` and `/oss`, which created a pricing dissonance with
 * the page's "senior engineer, DPAs, multi-week engagements" promise.
 * The final CTA now points to delivery only.
 *
 * The mailto submit handler is the only Client Component in this
 * tree (`InquiryForm` from `./inquiry-form`). The FAQ accordion is
 * also a Client Component.
 */
import { FAQSection } from "./faq-section"
import { FinalCta } from "./final-cta"
import { Hero } from "./hero"
import { Inquiry } from "./inquiry"
import { JsonLd } from "./json-ld"
import { Personas } from "./personas"
import { ProcessTimeline } from "./process-timeline"
import { ProofPoints } from "./proof-points"
import { TrustAndCompliance } from "./trust-and-compliance"

export const Enterprise = {
  JsonLd,
  Hero,
  Trust: TrustAndCompliance,
  Personas,
  ProofPoints,
  Process: ProcessTimeline,
  Inquiry,
  FAQ: FAQSection,
  FinalCta,
} as const

// Named re-exports for consumers that want a single component
// without going through the namespace.
export {
  FAQSection,
  FinalCta,
  Hero,
  Inquiry,
  JsonLd,
  Personas,
  ProcessTimeline,
  ProofPoints,
  TrustAndCompliance,
}
