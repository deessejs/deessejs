import type { Metadata } from "next"

import { BlocksBrowser } from "./_components/blocks-browser"
import { BLOCK_CATEGORIES } from "./_components/block-categories"
import { BLOCK_CATALOGUE } from "./_components/blocks-list"

export const metadata: Metadata = {
  title: "Blocks",
  description:
    "Production-ready marketing sections. Hero, CTA, pricing, FAQ, and more. Drop them into any DeesseJS template.",
}

/**
 * Blocks catalogue index at `/blocks`.
 *
 * Two-column layout: nav sidebar on the left, category grid on
 * the right. Each grid card is one category (Hero, CTA, Feature,
 * Pricing, Testimonial, Stats, FAQ, Footer) with a layout-shaped
 * preview.
 *
 * Wrapper + final CTA from `(marketing)/blocks/layout.tsx`.
 * Mirror of `components/page.tsx` with block-specific copy.
 */
export default function BlocksPage() {
  // Map each category to a representative block. The grid shows
  // one card per category; the representative block drives the
  // preview's layout discriminator. We pick the first block in
  // the category for stability.
  const categoryToBlock = Object.fromEntries(
    BLOCK_CATEGORIES.map((category) => {
      const firstBlock = BLOCK_CATALOGUE.find(
        (block) => block.category === category.id,
      )
      return [category.id, firstBlock]
    }).filter(([, block]) => Boolean(block)),
  ) as Record<(typeof BLOCK_CATEGORIES)[number]["id"], (typeof BLOCK_CATALOGUE)[number]>

  return (
    <>
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="relative z-10 flex flex-col items-center gap-3 px-6 py-16 text-center sm:py-20 lg:py-24">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Blocks
          </p>
          <h1 className="text-heading-40 font-medium tracking-tight text-balance sm:text-heading-48 lg:text-heading-56">
            Marketing sections, ready to drop in.
          </h1>
          <p className="max-w-2xl text-copy-18 text-pretty leading-7 text-muted-foreground text-balance [&:not(:first-child)]:mt-0">
            The marketing sections every DeesseJS template ships
            with. Browse a category, click any card for the detail
            page.
          </p>
        </div>
      </header>

      {/* Two-column browser: sidebar + category grid. */}
      <BlocksBrowser
        categories={BLOCK_CATEGORIES}
        categoryToBlock={categoryToBlock}
      />
    </>
  )
}