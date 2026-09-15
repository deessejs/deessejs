import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CategoryPage } from "@/app/(marketing)/components/_components/category-page"
import {
  CATEGORY_ORDER,
  COMPONENT_CATEGORIES,
  getCategory,
} from "@/app/(marketing)/components/_components/categories"

/**
 * /components/[category]
 *
 * Dynamic route — single file catches every category slug. Static
 * params are pre-rendered at build time from `CATEGORY_ORDER`.
 *
 * Unknown slugs hit `notFound()` so a typo'd URL returns 404
 * instead of a placeholder page (the category only exists if it
 * is in the single source of truth).
 */

type Params = { category: string }

export function generateStaticParams(): Array<Params> {
  return CATEGORY_ORDER.map((slug) => ({ category: slug }))
}

export function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  return params.then(({ category }) => {
    const match = getCategory(category)
    if (!match) {
      return { title: "Category not found" }
    }
    return {
      title: `${match.name} — Components`,
      description: match.description,
    }
  })
}

export default async function CategoryRoute({
  params,
}: {
  params: Promise<Params>
}) {
  const { category } = await params
  const match = getCategory(category)
  if (!match) notFound()
  return <CategoryPage category={match} />
}
