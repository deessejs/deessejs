import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  CATEGORY_ORDER,
  getCategory,
} from "@/components/catalog/components/categories"
import { CATALOGUE_COMPONENTS } from "@/components/catalog/components/catalogue"
import { ComponentCategoryBrowserClient } from "@/components/catalog/components/category-browser"

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

/**
 * /components/[category]
 *
 * Dynamic route — single file catches every category slug. Static
 * params are pre-rendered at build time from `CATEGORY_ORDER`.
 *
 * Unknown slugs hit `notFound()` so a typo'd URL returns 404
 * instead of a placeholder page.
 *
 * Pre-refactor: the body was split across `ComponentPage`,
 * `ComponentCategoryBrowser`, and `ComponentListGrid`. The hero
 * is inlined here; the search-bearing browser lives in
 * `<ComponentCategoryBrowserClient>`.
 */
export default async function CategoryRoute({
  params,
}: {
  params: Promise<Params>
}) {
  const { category } = await params
  const match = getCategory(category)
  if (!match) notFound()

  const components = CATALOGUE_COMPONENTS.filter(
    (component) => component.category === match.id,
  )

  return (
    <>
      {/* Hero — left-aligned, category-specific copy. */}
      <header className="border-b border-border px-6 py-16 lg:px-10 lg:py-20">
        <div className="flex flex-col gap-3">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            {match.name}
          </p>
          <h1 className="text-heading-40 font-medium tracking-tight text-balance">
            {match.name}.
          </h1>
          <p className="max-w-2xl text-copy-18 text-pretty leading-7 text-muted-foreground text-balance [&:not(:first-child)]:mt-0">
            {match.description}
          </p>
        </div>
      </header>

      <ComponentCategoryBrowserClient
        category={match}
        components={components}
      />
    </>
  )
}
