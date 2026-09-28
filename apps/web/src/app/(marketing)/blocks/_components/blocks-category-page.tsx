import type { BlockCategory } from "./block-categories"
import { BLOCK_CATEGORIES } from "./block-categories"
import { BlocksCategoryBrowser } from "./blocks-category-browser"
import { BLOCK_CATALOGUE } from "./blocks-list"

type Props = {
  category: BlockCategory
}

/**
 * Shared body for `/blocks/[category]`.
 *
 * Renders only the 2-column browser (nav sidebar + grid of the
 * 4 blocks in this category). No hero — the layout
 * `(marketing)/blocks/layout.tsx` provides the page frame
 * (MarketingPage + diagonal stripes + shared-border card) and
 * the final 2-col CTA, but we don't add a category-specific hero
 * here. The category name is implicit in the active state of the
 * sidebar and the grid header.
 */
export function BlocksCategoryPage({ category }: Props) {
  return (
    <BlocksCategoryBrowser
      blocks={BLOCK_CATALOGUE}
      categories={BLOCK_CATEGORIES}
      pinnedCategory={category.id}
    />
  )
}