/**
 * Pricing page namespace — single import surface for every section on
 * `/pricing`.
 *
 * Mirrors the pattern established by `@/components/pages/homepage`:
 * the route file imports `Pricing` and renders each section as
 * `<Pricing.X />`, becoming a literal table of contents.
 *
 * Sections:
 *   - JsonLd          — FAQPage schema for SEO (mounted early)
 *   - Hero            — proposition centrée
 *   - LicenseTypes    — Community and Pro cards
 *   - TechStack       — "Built with" strip
 *   - Comparison      — Community and Pro comparison
 *   - Personas        — who the offer serves
 *   - EnterpriseReady — custom procurement, support, or security contact path
 *   - FAQ             — grouped offer and billing answers
 *   - FinalCta        — last 2-col block
 *
 */
import { Comparison } from "./comparison"
import { EnterpriseReady } from "./enterprise-ready"
import { FAQ } from "./faq"
import { FinalCta } from "./final-cta"
import { Hero } from "./hero"
import { JsonLd } from "./json-ld"
import { LicenseTypes } from "./license-types"
import { Personas } from "./personas"
import { TechStack } from "./tech-stack"

export const Pricing = {
  JsonLd,
  Hero,
  LicenseTypes,
  TechStack,
  Comparison,
  Personas,
  EnterpriseReady,
  FAQ,
  FinalCta,
} as const

// Named re-exports for consumers that want a single component
// without going through the namespace.
export {
  Comparison,
  EnterpriseReady,
  FAQ,
  FinalCta,
  Hero,
  JsonLd,
  LicenseTypes,
  Personas,
  TechStack,
}
