/**
 * /vision page namespace — single import surface for every
 * section.
 *
 * Mirrors the pattern established by `@/components/pages/enterprise`
 * and `@/components/pages/delivery`: the route file imports
 * `Vision` and renders each section as `<Vision.X />`.
 *
 * Sections, top to bottom:
 *   - Hero     — eyebrow + h1 + lead + Last updated
 *   - Horizons — Now / Next / Beyond sections (data in lib/vision/horizons.ts)
 *
 * The closing "Read next" block lives outside this namespace and is
 * rendered directly by `page.tsx` via the shared `_shared/RelatedLinks`.
 */
import { Hero } from "./hero"
import { Horizons } from "./horizons"

export const Vision = {
  Hero,
  Horizons,
} as const

// Named re-exports for consumers that want a single component
// without going through the namespace (e.g. tests, storybook).
export { Hero, Horizons }
