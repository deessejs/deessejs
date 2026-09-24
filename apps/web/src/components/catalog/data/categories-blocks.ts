/**
 * Catalogue categories for the blocks registry at
 * /blocks/[category]. V2 ships eight categories: hero, cta,
 * feature, pricing, testimonial, stats, faq, footer. Each has
 * 2-4 blocks in `catalogue-blocks.ts`.
 *
 * `blockNames` is a comma-separated list of block slugs
 * rendered in the placeholder card on the index page. It is
 * the only field that distinguishes `BlockCategory` from
 * `ComponentCategory` (which doesn't render a block list).
 */

import type { CatalogCategory } from "./types"

export type BlockCategoryId =
  | "hero"
  | "cta"
  | "feature"
  | "pricing"
  | "testimonial"
  | "stats"
  | "faq"
  | "footer"

export type BlockCategory = CatalogCategory & {
  id: BlockCategoryId
  slug: BlockCategoryId
  blockNames: string
}

export const BLOCK_CATEGORY_ORDER: ReadonlyArray<BlockCategoryId> = [
  "hero",
  "cta",
  "feature",
  "pricing",
  "testimonial",
  "stats",
  "faq",
  "footer",
]

export const BLOCK_CATEGORIES: ReadonlyArray<BlockCategory> = [
  {
    id: "hero",
    slug: "hero",
    name: "Hero",
    description:
      "The first scroll. Headline, lead, primary CTA. Variants for split layouts, embedded mockups, and announcement banners.",
    blockNames: "hero-centered, hero-split-image, hero-with-mockup, hero-with-cta-banner",
  },
  {
    id: "cta",
    slug: "cta",
    name: "CTA",
    description:
      "Call-to-action sections. Banner strips, full-bleed closers, and repeating CTAs that slot between features and pricing.",
    blockNames: "cta-banner, cta-final, cta-repeating",
  },
  {
    id: "feature",
    slug: "feature",
    name: "Feature",
    description:
      "Feature grids. Bento layouts, vertical lists, side-by-side comparisons. Where the value props become tangible.",
    blockNames: "feature-bento, feature-list, feature-comparison",
  },
  {
    id: "pricing",
    slug: "pricing",
    name: "Pricing",
    description:
      "Pricing surfaces. Layered cards, comparison tables, pricing FAQ. The section that turns visitors into buyers.",
    blockNames: "pricing-three-layer, pricing-comparison-table, pricing-faq",
  },
  {
    id: "testimonial",
    slug: "testimonial",
    name: "Testimonial",
    description:
      "Social proof. Pairs of quotes, walls of love, customer logos with excerpts.",
    blockNames: "testimonial-pair, testimonial-wall",
  },
  {
    id: "stats",
    slug: "stats",
    name: "Stats",
    description:
      "Numbers. Tier-1 third-party metrics (npm, GitHub), in-house KPIs, tier breakdowns.",
    blockNames: "stats-four-cells, stats-tier",
  },
  {
    id: "faq",
    slug: "faq",
    name: "FAQ",
    description:
      "Objection handling. Accordions for long lists of Q&As, split layouts when the answer deserves more than a sentence.",
    blockNames: "faq-accordion, faq-split",
  },
  {
    id: "footer",
    slug: "footer",
    name: "Footer",
    description:
      "Page bottom. Multi-column footers with link groups, legal, status badge, social.",
    blockNames: "footer-column-rich, footer-minimal",
  },
]

export function getBlockCategory(id: string): BlockCategory | undefined {
  return BLOCK_CATEGORIES.find((category) => category.slug === id)
}
