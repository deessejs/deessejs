/**
 * /playbook page namespace. Single import surface for every section.
 *
 * Mirrors the pattern established by `@/components/pages/about` and
 * `@/components/pages/pricing`: the route file imports `Playbook`
 * and renders each section as `<Playbook.X />`, becoming a literal
 * table of contents.
 *
 * Sections, top to bottom:
 *   - Hero: H1 + lead + form, two-column with cover mockup
 *   - Problem: why agent-generated code ages poorly
 *   - WhatYouGet: chapter takeaways in reading order
 *   - WhoItsFor: concrete audience description, no personas
 *   - FinalCta: closing 2-col block with form, mirrors the
 *     shared `FinalCtaShell` recipe
 */
import { FinalCta } from "./final-cta"
import { Hero } from "./hero"
import { Problem } from "./problem"
import { WhatYouGet } from "./what-you-get"
import { WhoItsFor } from "./who-its-for"

export const Playbook = {
  Hero,
  Problem,
  WhatYouGet,
  WhoItsFor,
  FinalCta,
} as const

// Named re-exports for consumers that want a single component
// without going through the namespace (e.g. tests).
export {
  FinalCta,
  Hero,
  Problem,
  WhatYouGet,
  WhoItsFor,
}
