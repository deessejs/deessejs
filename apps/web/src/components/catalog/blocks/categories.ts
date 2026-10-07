/**
 * Block categories for /blocks/[category].
 *
 * Single source of truth for the eight buckets that group the
 * blocks in `blocks-list.ts`. The taxonomy mirrors the marketing
 * composition: each category is a recognisable section of a
 * landing page or product surface.
 *
 * The `blockNames` string is rendered inline in the placeholder
 * card so each category page reads as "the X, Y, Z of this
 * category are coming" instead of a generic "coming soon."
 */

export type BlockCategoryId =
  | "hero"
  | "cta"
  | "feature"
  | "pricing"
  | "testimonial"
  | "stats"
  | "faq"
  | "footer"

export type BlockCategory = {
  id: BlockCategoryId
  /** URL slug. */
  slug: BlockCategoryId
  /** Human label. Used in eyebrow and H1. */
  name: string
  /** One-line description shown in the lead paragraph. */
  description: string
  /** Inline list of blocks, rendered in the placeholder card. */
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
      "Feature grids: bento layouts, vertical lists, side-by-side comparisons. Where the value props become tangible.",
    blockNames: "feature-bento, feature-list, feature-comparison",
  },
  {
    id: "pricing",
    slug: "pricing",
    name: "Pricing",
    description:
      "Pricing surfaces. Layered cards, comparison tables, FAQ combo. The section that turns visitors into buyers.",
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
      "Numbers. Tier-1 third-party metrics (npm, GitHub), in-house KPIs, and tier breakdowns.",
    blockNames: "stats-four-cells, stats-tier",
  },
  {
    id: "faq",
    slug: "faq",
    name: "FAQ",
    description:
      "Objection handling. Accordions for the long list, split layouts when the answer deserves more than a sentence.",
    blockNames: "faq-accordion, faq-split",
  },
  {
    id: "footer",
    slug: "footer",
    name: "Footer",
    description:
      "Page bottom. Column-rich footers with link groups, legal, status. Minimal variants for single-page layouts.",
    blockNames: "footer-column-rich, footer-minimal",
  },
]

export function getBlockCategory(
  id: string,
): BlockCategory | undefined {
  return BLOCK_CATEGORIES.find((category) => category.slug === id)
}