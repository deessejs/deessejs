import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  SECTION_CATEGORIES,
  SECTION_CATEGORY_ORDER,
  getSectionCategory,
} from "@/components/catalog/sections/categories"
import { SECTION_CATALOGUE } from "@/components/catalog/sections/catalogue"
import { SectionsCategoryBrowserClient } from "@/components/catalog/sections/category-browser"

type Params = { category: string }

export function generateStaticParams(): Array<Params> {
  return SECTION_CATEGORY_ORDER.map((slug) => ({ category: slug }))
}

export function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  return params.then(({ category }) => {
    const match = getSectionCategory(category)
    if (!match) {
      return { title: "Category not found" }
    }
    return {
      title: `${match.name} — Sections`,
      description: match.description,
    }
  })
}

/**
 * /sections/[category]
 *
 * Dynamic route — single file catches every category slug. Static
 * params are pre-rendered at build time from `SECTION_CATEGORY_ORDER`.
 *
 * Unknown slugs hit `notFound()` so a typo'd URL returns 404
 * instead of a placeholder page.
 *
 * Pre-refactor: the body was split across `SectionsCategoryPage`
 * and `SectionsCategoryBrowser`. Both have been folded into
 * `<SectionsCategoryBrowserClient>`.
 */
export default async function SectionsCategoryRoute({
  params,
}: {
  params: Promise<Params>
}) {
  const { category } = await params
  const match = getSectionCategory(category)
  if (!match) notFound()

  return (
    <SectionsCategoryBrowserClient
      sections={SECTION_CATALOGUE}
      categories={SECTION_CATEGORIES}
      pinnedCategory={match.id}
    />
  )
}
