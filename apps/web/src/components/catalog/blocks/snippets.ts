/**
 * Snippets for the Code tab on every
 * `/blocks/[category]/[block]` page. Each entry is a small JSX
 * example that renders the block as a single composition with
 * placeholder inner content. V2 will swap these for real source
 * from the registered sections of the marketing pages (or a
 * dedicated `packages/blocks/` package once one lands).
 *
 * No blocks are shipped through the registry today (`ITEMS.blocks`
 * is empty), so every entry uses the same uniform placeholder to
 * avoid showing consumers hand-written code that can't be installed.
 * The placeholder stays exhaustive over `CatalogueBlock["slug"]`
 * so adding a new block without a snippet surfaces as a compile
 * error, not a runtime fallback.
 */

import type { CatalogueBlock } from "./catalogue"

const PREVIEW_PLACEHOLDER = `// Source coming in V3.
//
// This block is documented on /blocks but its implementation
// has not landed in the registry yet. The code samples below
// preview the layout shape; the registry install will go live
// once the block is ready.
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
} as const satisfies Record<CatalogueBlock["slug"], string>

export function getBlockSnippet(slug: CatalogueBlock["slug"]): string {
  // `as const satisfies Record<...>` makes the type exact with no
  // index signature, so a direct `SNIPPETS[slug]` access fails type
  // check. Cast through `unknown` first so we keep the function's
  // `string` return type without an `| undefined` widening.
  const map = SNIPPETS as unknown as Record<string, string>
  return map[slug]!
}
