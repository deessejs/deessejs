/**
 * /playbook page namespace — single import surface for every section.
 *
 * Mirrors the pattern established by `@/components/pages/about` and
 * `@/components/pages/pricing`: the route file imports `Playbook`
 * and renders each section as `<Playbook.X />`, becoming a literal
 * table of contents.
 *
 * Sections, top to bottom:
 *   - Hero           — H1 + lead + cover placeholder + form
 *   - Problem        — why agent-generated code ages poorly
 *   - WhatYouGet     — chapter takeaways in reading order
 *   - Preview        — cover thumbnail + TOC card (proof of level)
 *   - WhoItsFor      — concrete audience description, no personas
 *   - AboutTheAuthor — first-person working paragraph (TODO)
 *   - FinalCta       — repeated form + expectations copy
 */
import { AboutTheAuthor } from "./about-the-author"
import { FinalCta } from "./final-cta"
import { Hero } from "./hero"
import { Preview } from "./preview"
import { Problem } from "./problem"
import { WhatYouGet } from "./what-you-get"
import { WhoItsFor } from "./who-its-for"

export const Playbook = {
  Hero,
  Problem,
  WhatYouGet,
  Preview,
  WhoItsFor,
  AboutTheAuthor,
  FinalCta,
} as const

// Named re-exports for consumers that want a single component
// without going through the namespace (e.g. tests).
export {
  AboutTheAuthor,
  FinalCta,
  Hero,
  Preview,
  Problem,
  WhatYouGet,
  WhoItsFor,
}
