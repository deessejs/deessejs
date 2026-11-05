/**
 * Snippets for the Code tab on every
 * `/sections/[category]/[section]` page. Each entry is a small JSX
 * example that renders the section as a single composition with
 * placeholder inner content. V2 will swap these for real source
 * from the registered sections of the marketing pages (or a
 * dedicated `packages/sections/` package once one lands).
 *
 * No sections are shipped through the registry today (`ITEMS.blocks`
 * is empty), so every entry uses the same uniform placeholder to
 * avoid showing consumers hand-written code that can't be installed.
 * The placeholder stays exhaustive over `CatalogueSection["slug"]`
 * so adding a new section without a snippet surfaces as a compile
 * error, not a runtime fallback.
 */

import type { CatalogueSection } from "./catalogue"

const PREVIEW_PLACEHOLDER = `// Source coming in V3.
//
// This section is documented on /sections but its implementation
// has not landed in the registry yet. The code samples below
// preview the layout shape; the registry install will go live
// once the section is ready.
`

const SNIPPETS = {
  "hero-centered": PREVIEW_PLACEHOLDER,
  "hero-split-image": PREVIEW_PLACEHOLDER,
  "hero-with-mockup": PREVIEW_PLACEHOLDER,
  "hero-with-cta-banner": PREVIEW_PLACEHOLDER,
  "cta-banner": PREVIEW_PLACEHOLDER,
  "cta-final": PREVIEW_PLACEHOLDER,
  "cta-repeating": PREVIEW_PLACEHOLDER,
  "feature-bento": PREVIEW_PLACEHOLDER,
  "feature-list": PREVIEW_PLACEHOLDER,
  "feature-comparison": PREVIEW_PLACEHOLDER,
  "pricing-three-layer": PREVIEW_PLACEHOLDER,
  "pricing-comparison-table": PREVIEW_PLACEHOLDER,
  "pricing-faq": PREVIEW_PLACEHOLDER,
  "testimonial-pair": PREVIEW_PLACEHOLDER,
  "testimonial-wall": PREVIEW_PLACEHOLDER,
  "stats-four-cells": PREVIEW_PLACEHOLDER,
  "stats-tier": PREVIEW_PLACEHOLDER,
  "faq-accordion": PREVIEW_PLACEHOLDER,
  "faq-split": PREVIEW_PLACEHOLDER,
  "footer-column-rich": PREVIEW_PLACEHOLDER,
  "footer-minimal": PREVIEW_PLACEHOLDER,
} satisfies Record<CatalogueSection["slug"], string>

const SNIPPET_BY_SLUG = new Map(Object.entries(SNIPPETS))

export function getSectionSnippet(slug: CatalogueSection["slug"]): string {
  return SNIPPET_BY_SLUG.get(slug) ?? PREVIEW_PLACEHOLDER
}
