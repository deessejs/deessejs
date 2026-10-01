import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CatalogPreviewTabs } from "@/components/catalog/catalog-preview-tabs"
import { ComponentPreview } from "@/components/catalog/components/preview"
import {
  getAllComponentParams,
  getComponent,
} from "@/components/catalog/components/catalogue"
import {
  getCategory,
} from "@/components/catalog/components/categories"
import { getComponentSnippet } from "@/components/catalog/components/snippets"

const COMPONENTS_REPO_URL =
  "https://github.com/deessejs/deessejs/tree/main/packages/ui/src/components"

/**
 * /components/[category]/[component]
 *
 * Dynamic catch-all for the leaf of the components tree. Pre-renders
 * every known `(category, component)` pair from the catalogue; a
 * pair that does not exist returns 404.
 *
 * The category is validated against the component: a typo'd
 * `/components/forms/buttom` (wrong category for the slug) also
 * returns 404 rather than rendering the wrong page.
 *
 * Pre-refactor: this route delegated to `ComponentLeafHero` and
 * `ComponentPreviewTabs`. Both have been inlined here — the hero
 * markup is small enough to write directly, and `ComponentPreviewTabs`
 * was a one-line wrapper around `CatalogPreviewTabs` that resolved
 * the snippet and the repo URL.
 */
type Params = { category: string; component: string }

export function generateStaticParams(): Array<Params> {
  return getAllComponentParams()
}

export function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  return params.then(({ component }) => {
    const match = getComponent(component)
    if (!match) return { title: "Component not found" }
    return {
      title: `${match.name} — Components`,
      description: match.description,
    }
  })
}

export default async function ComponentRoute({
  params,
}: {
  params: Promise<Params>
}) {
  const { category, component } = await params
  const match = getComponent(component)
  // Either the slug is unknown, or the (category, component) pair
  // does not match the catalogue. Both → 404.
  if (!match || match.category !== category) notFound()
  const categoryMatch = getCategory(category)
  if (!categoryMatch) notFound()

  return (
    <>
      <header className="border-b border-border px-6 py-16 lg:px-10 lg:py-20">
        <div className="flex flex-col gap-3">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            {categoryMatch.name}
          </p>
          <h1 className="text-heading-40 font-medium tracking-tight text-balance">
            {match.name}.
          </h1>
          <p className="max-w-2xl text-copy-18 text-pretty leading-7 text-muted-foreground text-balance [&:not(:first-child)]:mt-0">
            {match.description}
          </p>
        </div>
      </header>
      <section
        aria-label={`${match.name} preview`}
        className="px-6 py-12 lg:px-10"
      >
        <CatalogPreviewTabs
          slug={match.slug}
          itemName={match.name}
          itemKind="component"
          sourceRepoUrl={COMPONENTS_REPO_URL}
          snippet={getComponentSnippet(match.slug)}
          preview={<ComponentPreview slug={match.slug} />}
        />
      </section>
    </>
  )
}
