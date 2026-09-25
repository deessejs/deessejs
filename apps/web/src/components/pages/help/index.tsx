/**
 * /help page namespace — single import surface for every section.
 *
 * Mirrors the pattern established by `@/components/pages/enterprise`
 * and `@/components/pages/delivery`: the route file imports
 * `Help` and renders each section as `<Help.X />`, becoming a
 * literal table of contents.
 *
 * Sections, top to bottom:
 *   - Hero             — eyebrow + h1 + lead
 *   - SelfServe        — Knowledge Base / Docs / Changelog link rows
 *   - Community        — GitHub discussions/issues + X + LinkedIn
 *   - Email            — General / Security / Pro Education / Enterprise
 *   - ResponseTimes    — <dl> of three dt/dd pairs
 *
 * The closing "Read next" block lives outside this namespace and is
 * rendered directly by `page.tsx` (it imports the shared
 * `_shared/RelatedLinks` shell). Same pattern as enterprise/delivery
 * render `<FinalCta>` directly via `_shared/final-cta`.
 *
 * No `JsonLd` (no FAQ schema today) and no `_shared/` sub-folder
 * (helpers are inlined because their shapes are unique to this page).
 */
import { Community } from "./community"
import { Email } from "./email"
import { Hero } from "./hero"
import { ResponseTimes } from "./response-times"
import { SelfServe } from "./self-serve"

export const Help = {
  Hero,
  SelfServe,
  Community,
  Email,
  ResponseTimes,
} as const

// Named re-exports for consumers that want a single component
// without going through the namespace (e.g. tests, storybook).
export { Community, Email, Hero, ResponseTimes, SelfServe }
