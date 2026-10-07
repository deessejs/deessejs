/**
 * /principles page namespace — single import surface for every
 * section.
 *
 * Mirrors the pattern established by `@/components/pages/enterprise`
 * and `@/components/pages/delivery`: the route file imports
 * `Principles` and renders each section as `<Principles.X />`.
 *
 * Sections, top to bottom:
 *   - Hero        — eyebrow + h1 + lead
 *   - NineTenets  — H2 + <ol> grid of 9 <Card>s (data in lib/principles/tenets.ts)
 *
 * The closing "Read next" block lives outside this namespace and is
 * rendered directly by `page.tsx` via the shared `_shared/RelatedLinks`.
 */
import { FinalCta } from "./final-cta"
import { Hero } from "./hero"
import { NineTenets } from "./nine-tenets"

export const Principles = {
  Hero,
  NineTenets,
  FinalCta,
} as const

// Named re-exports for consumers that want a single component
// without going through the namespace (e.g. tests, storybook).
export { FinalCta, Hero, NineTenets }
