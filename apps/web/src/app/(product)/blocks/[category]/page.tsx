import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  BLOCK_CATEGORIES,
  BLOCK_CATEGORY_ORDER,
  getBlockCategory,
} from "@/components/catalog/blocks/categories"
import { BLOCK_CATALOGUE } from "@/components/catalog/blocks/catalogue"
import { BlocksCategoryBrowserClient } from "@/components/catalog/blocks/category-browser"

type Params = { category: string }

export function generateStaticParams(): Array<Params> {
  return BLOCK_CATEGORY_ORDER.map((slug) => ({ category: slug }))
}

export function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  return params.then(({ category }) => {
    const match = getBlockCategory(category)
    if (!match) {
      return { title: "Category not found" }
    }
    return {
      title: `${match.name} — Blocks`,
      description: match.description,
    }
  })
}

/**
 * /blocks/[category]
 *
 * Dynamic route — single file catches every category slug. Static
 * params are pre-rendered at build time from `BLOCK_CATEGORY_ORDER`.
 *
 * Unknown slugs hit `notFound()` so a typo'd URL returns 404
 * instead of a placeholder page.
 *
 * Pre-refactor: the body was split across `BlocksCategoryPage`
 * and `BlocksCategoryBrowser`. Both have been folded into
 * `<BlocksCategoryBrowserClient>`.
 */
export default async function BlocksCategoryRoute({
  params,
}: {
  params: Promise<Params>
}) {
  const { category } = await params
  const match = getBlockCategory(category)
  if (!match) notFound()

  return (
    <BlocksCategoryBrowserClient
      blocks={BLOCK_CATALOGUE}
      categories={BLOCK_CATEGORIES}
      pinnedCategory={match.id}
    />
  )
}
