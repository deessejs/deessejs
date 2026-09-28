import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { BlocksCategoryPage } from "@/app/(marketing)/blocks/_components/blocks-category-page"
import {
  BLOCK_CATEGORY_ORDER,
  getBlockCategory,
} from "@/app/(marketing)/blocks/_components/block-categories"

/**
 * /blocks/[category]
 *
 * Dynamic route — single file catches every category slug. Static
 * params are pre-rendered at build time from `BLOCK_CATEGORY_ORDER`.
 *
 * Unknown slugs hit `notFound()` so a typo'd URL returns 404
 * instead of a placeholder page.
 */

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

export default async function BlocksCategoryRoute({
  params,
}: {
  params: Promise<Params>
}) {
  const { category } = await params
  const match = getBlockCategory(category)
  if (!match) notFound()
  return <BlocksCategoryPage category={match} />
}