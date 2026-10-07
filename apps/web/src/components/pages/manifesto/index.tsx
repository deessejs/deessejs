/**
 * /manifesto page namespace — single import surface for every
 * section.
 *
 * Mirrors the pattern established by `@/components/pages/enterprise`
 * and `@/components/pages/delivery`: the route file imports
 * `Manifesto` and renders each section as `<Manifesto.X />`.
 *
 * Sections, top to bottom:
 *   - Hero    — eyebrow + h1 + lead + meta <dl>
 *   - Intro   — two-paragraph framing
 *   - Beliefs — six numbered <article> rows (data in lib/manifesto/beliefs.ts)
 *
 * The closing "Read next" block + the "Browse templates" button
 * row live outside this namespace and are rendered directly by
 * `page.tsx` (the button is page-specific to /templates and has
 * no other consumer).
 */
import { Beliefs } from "./beliefs"
import { FinalCta } from "./final-cta"
import { Hero } from "./hero"
import { Intro } from "./intro"

export const Manifesto = {
  Hero,
  Intro,
  Beliefs,
  FinalCta,
} as const

// Named re-exports for consumers that want a single component
// without going through the namespace (e.g. tests, storybook).
export { Beliefs, FinalCta, Hero, Intro }
