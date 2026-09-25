import Link from "next/link"

import { BlockCardPreview } from "./block-card-preview"
import type { CatalogueBlock } from "./blocks-list"
import type { BlockCategory } from "./block-categories"

type Props = {
  categories: ReadonlyArray<BlockCategory>
  /**
   * Map of `category.id` → a representative block. Used to
   * drive the card preview. Any block in the category works;
   * V1 uses the first one.
   */
  categoryToBlock: Record<BlockCategory["id"], CatalogueBlock>
}

/**
 * Grid of category cards rendered on the `/blocks` index.
 *
 * Each card represents one category (Hero, CTA, Feature,
 * Pricing, Testimonial, Stats, FAQ, Footer) with a layout-
 * driven mock preview at the top and a meta block below.
 * Clicking any card navigates to that category's page.
 *
 * Grid: shared-border recipe — 1/2/3/4 columns responsive,
 * gap-0, nth-child selectors drop trailing right and bottom
 * borders so the grid reads as one continuous table.
 */
export function BlocksCategoryGrid({ categories, categoryToBlock }: Props) {
  return (
    <ul className="grid list-none grid-cols-1 gap-0 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>li]:border-r [&>li]:border-b [&>li]:border-border [&>li:nth-child(2n)]:md:border-r-0 [&>li:nth-child(3n)]:lg:border-r-0 [&>li:nth-child(4n)]:xl:border-r-0 [&>li:nth-last-child(-n+2)]:md:border-b-0 [&>li:nth-last-child(-n+3)]:lg:border-b-0 [&>li:nth-last-child(-n+4)]:xl:border-b-0">
      {categories.map((category) => {
        const block = categoryToBlock[category.id]
        if (!block) return null
        const href = `/blocks/${category.slug}`
        return (
          <li key={category.id}>
            <Link
              href={href}
              aria-label={`Browse the ${category.name} category`}
              className="group flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex h-full flex-col bg-background transition-colors group-hover:bg-accent/30">
                {/* 16:9 preview — drives a layout-shaped mock via
                    the block's `layout` discriminator. */}
                <BlockCardPreview block={block} />
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <h2 className="text-label-16 leading-snug font-semibold tracking-tight text-balance">
                    {category.name}
                  </h2>
                  <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
                    {category.description}
                  </p>
                  <span className="text-label-13 text-muted-foreground font-mono">
                    {category.blockNames.split(",")[0]?.trim()}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}