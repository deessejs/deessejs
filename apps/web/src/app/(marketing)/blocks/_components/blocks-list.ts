/**
 * Block catalogue for /blocks/[category]/[block].
 *
 * V1 hand-maintained list of 22 marketing blocks distributed over
 * the eight categories in `block-categories.ts`. Each block
 * declares its `category` (validated by the leaf route) and a
 * `layout` discriminator used in the V1 dummy leaf placeholder.
 *
 * V2 will auto-generate this list by scanning
 * `apps/web/src/app/(marketing)/_components/*.tsx` (the section
 * composites already used in the marketing pages) and the inline
 * sections of the marketing route pages. V1 ships the catalogue
 * shape so V2 only has to swap the data source.
 */

import type { BlockCategoryId } from "./block-categories"

export type BlockLayout = "split" | "stacked" | "bento" | "centered"

export type CatalogueBlock = {
  /** URL slug. Unique within the catalogue. */
  slug: string
  /** Display name. */
  name: string
  /** Short one-line description, used in cards. */
  description: string
  /** Category the block belongs to. Validated against the route param. */
  category: BlockCategoryId
  /** V1 dummy visual discriminator (rendered in the leaf placeholder). */
  layout: BlockLayout
}

export const BLOCK_CATALOGUE: ReadonlyArray<CatalogueBlock> = [
  // Hero
  {
    slug: "hero-centered",
    name: "Hero — centered",
    description: "Centered headline, lead, and a single CTA. The default landing surface.",
    category: "hero",
    layout: "centered",
  },
  {
    slug: "hero-split-image",
    name: "Hero — split with image",
    description: "Two-column hero: copy on the left, image or screenshot on the right.",
    category: "hero",
    layout: "split",
  },
  {
    slug: "hero-with-mockup",
    name: "Hero — with mockup",
    description: "Headline above an embedded product mockup. The surface that anchors product demos.",
    category: "hero",
    layout: "stacked",
  },
  {
    slug: "hero-with-cta-banner",
    name: "Hero — with announcement banner",
    description: "Centered hero with an inline announcement chip above the headline.",
    category: "hero",
    layout: "centered",
  },

  // CTA
  {
    slug: "cta-banner",
    name: "CTA — banner",
    description: "Slim banner strip between sections. Single sentence plus one button.",
    category: "cta",
    layout: "centered",
  },
  {
    slug: "cta-final",
    name: "CTA — final",
    description: "Full-bleed closer at the bottom of the page. Last chance to convert.",
    category: "cta",
    layout: "centered",
  },
  {
    slug: "cta-repeating",
    name: "CTA — repeating",
    description: "Three-column variant with install / ship / manifesto as parallel affordances.",
    category: "cta",
    layout: "split",
  },

  // Feature
  {
    slug: "feature-bento",
    name: "Feature — bento grid",
    description: "Asymmetric bento grid for an uneven catalog of features.",
    category: "feature",
    layout: "bento",
  },
  {
    slug: "feature-list",
    name: "Feature — vertical list",
    description: "Vertical list of features with icons. Long-form density.",
    category: "feature",
    layout: "stacked",
  },
  {
    slug: "feature-comparison",
    name: "Feature — comparison",
    description: "Side-by-side comparison of two or three options. For buyers who triage.",
    category: "feature",
    layout: "split",
  },

  // Pricing
  {
    slug: "pricing-three-layer",
    name: "Pricing — three layers",
    description: "Three-card pricing tiers with one primary CTA per card.",
    category: "pricing",
    layout: "stacked",
  },
  {
    slug: "pricing-comparison-table",
    name: "Pricing — comparison table",
    description: "Attribute-by-attribute comparison across the three layers.",
    category: "pricing",
    layout: "stacked",
  },
  {
    slug: "pricing-faq",
    name: "Pricing — combined with FAQ",
    description: "Pricing cards stacked above the pricing FAQ. The complete buy decision on one page.",
    category: "pricing",
    layout: "stacked",
  },

  // Testimonial
  {
    slug: "testimonial-pair",
    name: "Testimonial — pair",
    description: "Two quotes side by side, each with avatar, name, role, company.",
    category: "testimonial",
    layout: "split",
  },
  {
    slug: "testimonial-wall",
    name: "Testimonial — wall",
    description: "A wall of customer quotes. For social proof at scale.",
    category: "testimonial",
    layout: "bento",
  },

  // Stats
  {
    slug: "stats-four-cells",
    name: "Stats — four cells",
    description: "Four large numbers in a row. Mix of internal KPIs and tier-1 third-party metrics.",
    category: "stats",
    layout: "split",
  },
  {
    slug: "stats-tier",
    name: "Stats — tier breakdown",
    description: "Stats grouped by tier (free / pro / enterprise) with per-tier counts.",
    category: "stats",
    layout: "stacked",
  },

  // FAQ
  {
    slug: "faq-accordion",
    name: "FAQ — accordion",
    description: "Vertical accordion of questions. The default FAQ surface.",
    category: "faq",
    layout: "stacked",
  },
  {
    slug: "faq-split",
    name: "FAQ — split layout",
    description: "Heading and lead on the left, accordion on the right. For FAQs that need more than a sentence.",
    category: "faq",
    layout: "split",
  },

  // Footer
  {
    slug: "footer-column-rich",
    name: "Footer — column rich",
    description: "Multi-column footer with link groups, legal, status badge, social.",
    category: "footer",
    layout: "stacked",
  },
  {
    slug: "footer-minimal",
    name: "Footer — minimal",
    description: "Single-row footer with brand, legal links, and a CTA. For single-page sites.",
    category: "footer",
    layout: "centered",
  },
]

/**
 * Look up a block by slug. Returns undefined if the slug is not
 * in the catalogue. The caller is responsible for verifying the
 * category match.
 */
export function getBlock(slug: string): CatalogueBlock | undefined {
  return BLOCK_CATALOGUE.find((block) => block.slug === slug)
}

/**
 * Generate every `(category, block)` pair that should be
 * pre-rendered by the leaf route.
 */
export function getAllBlockParams(): Array<{
  category: string
  block: string
}> {
  return BLOCK_CATALOGUE.map((block) => ({
    category: block.category,
    block: block.slug,
  }))
}