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
 *   - TechStack: the rotating logo wall, same as the homepage
 *   - Reading: the three most recent blog posts
 *   - FAQ: accordion in the enterprise 2-col layout
 *   - FinalCta: the shared closing block, same copy as the homepage
 *
 * The Problem, WhatYouGet, and WhoItsFor sections were removed
 * along with the content that fed them; see the page README for
 * what is gone and how to bring it back.
 */
import { FAQSection } from "./faq-section"
import { FinalCta } from "./final-cta"
import { Hero } from "./hero"
import { Reading } from "./reading"
import { TechStack } from "./tech-stack"

export const Playbook = {
  Hero,
  TechStack,
  Reading,
  FAQ: FAQSection,
  FinalCta,
} as const

// Named re-exports for consumers that want a single component
// without going through the namespace (e.g. tests).
export { FAQSection, FinalCta, Hero, Reading, TechStack }