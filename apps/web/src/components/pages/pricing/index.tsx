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
 *   - CadenceTabs     — strip 16px (lifetime vs subscription)
 *   - LicenseTypes    — 3-card grid (Community / Professional / Agency)
 *   - TechStack       — "Built with" strip
 *   - Comparison      — side-by-side comparison table (3 columns)
 *   - Personas        — who buys what
 *   - EnterpriseReady — paperwork-level engagement (SLA / DPAs / Procurement)
 *   - FAQ             — 4 grouped accordions
 *   - FinalCta        — last 2-col block
 *
 * Note: the cadence context (`PricingCadenceProvider`) is supplied by
 * the route file, not the namespace — it wraps the entire page tree
 * and lifting it into a section would split the React context across
 * tree boundaries.
 */
import { CadenceTabs } from "./cadence-tabs"
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
  CadenceTabs,
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
  CadenceTabs,
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
