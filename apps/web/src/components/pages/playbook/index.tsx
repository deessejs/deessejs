/**
 * /playbook page namespace. Single import surface for every section.
 *
 * Mirrors the pattern established by `@/components/pages/about` and
 * `@/components/pages/pricing`: the route file imports `Playbook`
 * and renders each section as `<Playbook.X />`, becoming a literal
 * table of contents.
 *
 * Sections, top to bottom:
 *   - Hero: H1 + lead + form, two-column with the cover mockup
 *   - Reading: the three most recent blog posts
 *   - FinalCta: the shared closing block, same copy as the homepage
 *
 * The Problem, WhatYouGet, and WhoItsFor sections were removed
 * along with the content that fed them; see the page README for
 * what is gone and how to bring it back.
 */
import { FinalCta } from "./final-cta"
import { Hero } from "./hero"
import { Reading } from "./reading"

export const Playbook = {
  Hero,
  Reading,
  FinalCta,
} as const

// Named re-exports for consumers that want a single component
// without going through the namespace (e.g. tests).
export { FinalCta, Hero, Reading }