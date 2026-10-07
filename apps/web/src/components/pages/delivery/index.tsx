/**
 * Delivery page namespace. Single import surface for every
 * section on `/delivery`.
 *
 * Mirrors the pattern established by `@/components/pages/homepage`,
 * `@/components/pages/pricing`, and `@/components/pages/enterprise`:
 * the route file imports `Delivery` and renders each section as
 * `<Delivery.X />`, becoming a literal table of contents.
 *
 * Sections, top to bottom:
 *   - JsonLd               — ContactPage + FAQPage schema (mounted first)
 *   - Hero                 — single-column proposition
 *   - Comparison           — vs traditional agency (2-col table)
 *   - EngagementModels     — 3 packaged formats
 *   - Process              — 4-step engineering protocol
 *   - ProofOfEngineering  — 6 production-grade standards
 *   - Intake               — 2-col intro + dummy form (id="intake")
 *   - FAQ                  — accordion (FAQPage mainEntity derived from same data)
 *   - FinalCta             — single mailto CTA
 *
 * Two Client Components in this tree: `IntakeForm` (form) and
 * `DeliveryFaq` (accordion).
 */
import { Comparison } from "./comparison"
import { EngagementModels } from "./engagement-models"
import { FAQSection } from "./faq-section"
import { FinalCta } from "./final-cta"
import { Hero } from "./hero"
import { Intake } from "./intake"
import { JsonLd } from "./json-ld"
import { Process } from "./process"
import { ProofOfEngineering } from "./proof-of-engineering"

export const Delivery = {
  JsonLd,
  Hero,
  Comparison,
  EngagementModels,
  Process,
  ProofOfEngineering,
  Intake,
  FAQ: FAQSection,
  FinalCta,
} as const

// Named re-exports for consumers that want a single component
// without going through the namespace.
export {
  Comparison,
  EngagementModels,
  FAQSection,
  FinalCta,
  Hero,
  Intake,
  JsonLd,
  Process,
  ProofOfEngineering,
}
