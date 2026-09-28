import type { Metadata } from "next"

import { calculateCatalogCounts } from "@/components/catalog/catalog-counts"
import { CatalogBrowserShell } from "@/components/catalog/catalog-browser-shell"
import { CatalogCategoryGrid } from "@/components/catalog/catalog-category-grid"
import { CatalogSidebar } from "@/components/catalog/catalog-sidebar"
import { BlockCardPreview } from "@/components/catalog/blocks/card-preview"
import { BLOCK_CATEGORIES } from "@/components/catalog/blocks/categories"
import { BLOCK_CATALOGUE } from "@/components/catalog/blocks/catalogue"

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
 *
 * Inlined from the previously-separate `BlocksBrowser` and
 * `BlocksCategoryGrid` orchestrators. UI is identical.
 */
export default function BlocksPage() {
  // Map each category to a representative block.
  const categoryToBlock = Object.fromEntries(
    BLOCK_CATEGORIES.map((category) => {
      const firstBlock = BLOCK_CATALOGUE.find(
        (block) => block.category === category.id,
      )
      return [category.id, firstBlock]
    }).filter(([, block]) => Boolean(block)),
  ) as Record<
    (typeof BLOCK_CATEGORIES)[number]["id"],
    (typeof BLOCK_CATALOGUE)[number]
  >

  // Per-category counts.
  const counts = calculateCatalogCounts(
    BLOCK_CATALOGUE,
    (block) => block.category,
  )

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
      <CatalogBrowserShell
        ariaLabel="Blocks catalogue"
        sidebar={
          <CatalogSidebar
            heading="Categories"
            basePath="/blocks"
            entries={BLOCK_CATEGORIES}
            counts={counts}
          />
        }
      >
        <CatalogCategoryGrid
          columns={4}
          entries={BLOCK_CATEGORIES.flatMap((category) => {
            const block = categoryToBlock[category.id]
            if (!block) return []
            return [
              {
                id: category.id,
                href: `/blocks/${category.slug}`,
                ariaLabel: `Browse the ${category.name} category`,
                preview: <BlockCardPreview block={block} />,
                title: category.name,
                description: category.description,
                footer: (
                  <span className="text-label-13 text-muted-foreground font-mono">
                    {category.blockNames.split(",")[0]?.trim()}
                  </span>
                ),
              },
            ]
          })}
        />
      </CatalogBrowserShell>
    </>
  )
}
