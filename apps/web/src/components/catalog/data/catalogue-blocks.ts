/**
 * Block catalogue for /blocks/[category]/[block].
 *
 * V2 ships 22 blocks across 8 categories. Each block declares
 * its `category` so the dynamic route can validate that
 * `(category, block)` is a coherent pair and return 404.
 *
 * V2 ships every block as `free` tier. `layout` is a V1 dummy
 * visual discriminator (split | stacked | bento | centered)
 * used by the block preview mock; V3 will drop it in favour of
 * the actual rendered section.
 *
 * V2 hand-maintained. V3 reads from the marketing page
 * sections (auto-generation) instead of this list.
 */

import type {
  CatalogItem,
  CatalogueList,
  CatalogTier,
} from "./types"
import type { BlockCategoryId } from "./categories-blocks"

export type { CatalogItem, CatalogueList, CatalogTier }
export type BlockTier = CatalogTier

// Blocks add a `layout` discriminator on top of the shared
// `CatalogItem`. The generic constrains the slug to `string`
// for V2 (V3 can switch to a literal union once we know the
// final list).
export type CatalogueBlock = CatalogItem<string, BlockCategoryId> & {
  layout: "split" | "stacked" | "bento" | "centered"
}

export const BLOCK_CATALOGUE: CatalogueList<CatalogueBlock> = [
  // ── hero (4) ────────────────────────────────────────────────
  {
    slug: "hero-centered",
    name: "Hero - centered",
    description:
      "Centered headline, lead, and a single CTA. The default landing surface.",
    category: "hero",
    tier: "free",
    layout: "centered",
  },
  {
    slug: "hero-split-image",
    name: "Hero - split with image",
    description:
      "Two-column hero: copy on the left, image or screenshot on the right.",
    category: "hero",
    tier: "free",
    layout: "split",
  },
  {
    slug: "hero-with-mockup",
    name: "Hero - with mockup",
    description: "Headline above an embedded product mockup.",
    category: "hero",
    tier: "free",
    layout: "stacked",
  },
  {
    slug: "hero-with-cta-banner",
    name: "Hero - with announcement banner",
    description: "Centered hero with an inline announcement chip above the headline.",
    category: "hero",
    tier: "free",
    layout: "centered",
  },

  // ── cta (3) ────────────────────────────────────────────────
  {
    slug: "cta-banner",
    name: "CTA - banner",
    description: "Slim banner strip with single sentence + button.",
    category: "cta",
    tier: "free",
    layout: "centered",
  },
  {
    slug: "cta-final",
    name: "CTA - final",
    description: "Full-bleed closer at the bottom of the page.",
    category: "cta",
    tier: "free",
    layout: "centered",
  },
  {
    slug: "cta-repeating",
    name: "CTA - repeating",
    description: "Three-column variant with install / ship / manifesto.",
    category: "cta",
    tier: "free",
    layout: "split",
  },

  // ── feature (3) ─────────────────────────────────────────────
  {
    slug: "feature-bento",
    name: "Feature - bento grid",
    description: "Asymmetric bento grid for an uneven catalog of features.",
    category: "feature",
    tier: "free",
    layout: "bento",
  },
  {
    slug: "feature-list",
    name: "Feature - vertical list",
    description: "Vertical list of features with icons. Long-form density.",
    category: "feature",
    tier: "free",
    layout: "stacked",
  },
  {
    slug: "feature-comparison",
    name: "Feature - comparison",
    description: "Side-by-side comparison of two or three options.",
    category: "feature",
    tier: "free",
    layout: "split",
  },

  // ── pricing (3) ────────────────────────────────────────────
  {
    slug: "pricing-three-layer",
    name: "Pricing - three layers",
    description: "Three-card pricing tiers with one primary CTA per card.",
    category: "pricing",
    tier: "free",
    layout: "stacked",
  },
  {
    slug: "pricing-comparison-table",
    name: "Pricing - comparison table",
    description: "Attribute-by-attribute comparison across the three layers.",
    category: "pricing",
    tier: "free",
    layout: "stacked",
  },
  {
    slug: "pricing-faq",
    name: "Pricing - combined with FAQ",
    description: "Pricing cards stacked above the pricing FAQ.",
    category: "pricing",
    tier: "free",
    layout: "stacked",
  },

  // ── testimonial (2) ────────────────────────────────────────
  {
    slug: "testimonial-pair",
    name: "Testimonial - pair",
    description: "Two quotes side by side, each with avatar, name, role.",
    category: "testimonial",
    tier: "free",
    layout: "split",
  },
  {
    slug: "testimonial-wall",
    name: "Testimonial - wall",
    description: "A wall of customer quotes. For social proof at scale.",
    category: "testimonial",
    tier: "free",
    layout: "bento",
  },

  // ── stats (2) ──────────────────────────────────────────────
  {
    slug: "stats-four-cells",
    name: "Stats - four cells",
    description: "Four large numbers in a row. Mix of internal and tier-1 metrics.",
    category: "stats",
    tier: "free",
    layout: "split",
  },
  {
    slug: "stats-tier",
    name: "Stats - tier breakdown",
    description: "Stats grouped by tier (free / pro / enterprise).",
    category: "stats",
    tier: "free",
    layout: "stacked",
  },

  // ── faq (2) ──────────────────────────────────────────────
  {
    slug: "faq-accordion",
    name: "FAQ - accordion",
    description: "Vertical accordion of questions.",
    category: "faq",
    tier: "free",
    layout: "stacked",
  },
  {
    slug: "faq-split",
    name: "FAQ - split layout",
    description: "Heading and lead on the left, accordion on the right.",
    category: "faq",
    tier: "free",
    layout: "split",
  },

  // ── footer (2) ────────────────────────────────────────────
  {
    slug: "footer-column-rich",
    name: "Footer - column rich",
    description: "Multi-column footer with link groups, legal, status badge, social.",
    category: "footer",
    tier: "free",
    layout: "stacked",
  },
  {
    slug: "footer-minimal",
    name: "Footer - minimal",
    description: "Single-row footer with brand, legal links, and a CTA.",
    category: "footer",
    tier: "free",
    layout: "centered",
  },
]

/**
 * Look up a block by slug. Returns undefined if the slug is
 * not in the catalogue. The caller is responsible for verifying
 * the category match.
 */
export function getBlock(slug: string): CatalogueBlock | undefined {
  return BLOCK_CATALOGUE.find((block) => block.slug === slug)
}

/**
 * Generate every `(category, block)` pair that should be
 * pre-rendered. Used by `generateStaticParams` at the leaf route.
 */
export function getAllBlockParams(): Array<{
  category: string
  block: string
}> {
  const out: Array<{ category: string; block: string }> = []
  for (const block of BLOCK_CATALOGUE) {
    out.push({ category: block.category, block: block.slug })
  }
  return out
}
