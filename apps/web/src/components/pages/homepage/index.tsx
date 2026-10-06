/**
 * Homepage namespace — single import surface for every section on `/`.
 *
 * Consumers (the `apps/web/src/app/(marketing)/page.tsx` route file)
 * import `Home` and call each section as `<Home.Foo />`. The page
 * becomes a literal table of contents: every section is one line, the
 * order is visible at a glance, and adding / reordering sections is a
 * one-line edit.
 *
 * Each section component lives in its own file in this folder. The
 * namespace is a static object (`as const`) so tree-shaking still
 * removes unreferenced sections from the production bundle, and so
 * TypeScript narrows each entry to its real function type.
 *
 * Naming: short names (`Hero`, `TechStack`) match the in-page call
 * sites — `<Home.Hero />` reads better than `<Home.HeroSection />`.
 * The folder layout keeps long-form aliases available for grep:
 *   - `hero.tsx` exports `Hero`
 *   - `cli-in-action.tsx` exports `CliInAction`
 *   - `faq-section.tsx` exports `FAQSection`
 *   - `faq.tsx` exports `FAQ` (the inner accordion)
 */
import { CliInAction } from "./cli-in-action"
import { CodingAgents } from "./coding-agents"
import { Contracts } from "./contracts"
import { ContractsGrid } from "@/components/marketing/contracts-grid"
import { DiagonalStripDivider } from "@/components/marketing/diagonal-strip-divider"
import { Ecosystem } from "./ecosystem"
import { EcosystemTabs } from "@/components/marketing/ecosystem-tabs"
import { FinalCta } from "./final-cta"
import { FAQ } from "./faq"
import { FAQSection } from "./faq-section"
import { ForWho } from "./for-who"
import { Hero } from "./hero"
import { Integrations } from "./integrations"
import { IntegrationColumns } from "@/components/marketing/integration-columns"
import { LatestGuides } from "./latest-guides"
import { Stats } from "./stats"
import { StatsStrip } from "@/components/marketing/stats-strip"
import { Surfaces } from "./surfaces"
import { SurfacesTabs } from "@/components/marketing/surfaces-tabs"
import { TechStack } from "./tech-stack"
import { TechStackGrid } from "@/components/marketing/tech-stack-grid"
import { Testimonials } from "./testimonials"
import { TestimonialsMarquee } from "@/components/marketing/testimonials-marquee"

export const Home = {
  Hero,
  TechStack,
  Surfaces,
  ForWho,
  DiagonalStripDivider,
  Contracts,
  CliInAction,
  LatestGuides,
  Ecosystem,
  Testimonials,
  Integrations,
  CodingAgents,
  Stats,
  FAQ: FAQSection,
  FinalCta,
} as const

// Named re-exports for consumers that want a single component
// without going through the namespace (e.g. tests, storybook).
export {
  CliInAction,
  CodingAgents,
  Contracts,
  DiagonalStripDivider,
  Ecosystem,
  FinalCta,
  FAQ,
  FAQSection,
  ForWho,
  Hero,
  Integrations,
  LatestGuides,
  Stats,
  Surfaces,
  TechStack,
  Testimonials,
}

// Shared lower-level components re-exported so consumer tests can
// stub them via `vi.mock('@/components/pages/homepage', ...)` without
// reaching into the _components directory.
export {
  ContractsGrid,
  EcosystemTabs,
  IntegrationColumns,
  StatsStrip,
  SurfacesTabs,
  TechStackGrid,
  TestimonialsMarquee,
}
