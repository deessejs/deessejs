import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import type { CatalogueComponent } from "./components-list"
import type { ComponentCategory } from "./categories"
import { CatalogueCard } from "./catalogue-card"
import { ComponentPreviewTabs } from "./component-preview-tabs"
import { getRelatedComponents } from "./components-list"

type Props = {
  component: CatalogueComponent
  category: ComponentCategory
}

/**
 * Shared body for every `/components/[category]/[component]` page.
 *
 * Wrapper + final CTA from `(marketing)/components/layout.tsx`.
 * This file renders the "← Back to" link, the centred hero, the
 * tabbed Preview/Code surface, and the Related components rail.
 *
 * Calque of `/blog/[slug]/page.tsx:114-120` for the "Back to"
 * affordance. The pattern uses an unstyled eyebrow on the leaf
 * (no tag/category label above the H1) — matching /blog and
 * /changelog which only show eyebrows on the index.
 */
export function ComponentPage({ component, category }: Props) {
  const related = getRelatedComponents(component.slug, 4)

  return (
    <>
      {/* Back to components */}
      <div className="px-6 pt-12 lg:px-10">
        <Link
          href="/components"
          className="inline-flex items-center gap-1 text-copy-14 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" aria-hidden />
          Back to components
        </Link>
      </div>

      {/* Hero */}
      <header className="px-6 pb-12 pt-6 lg:px-10">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tighter text-balance sm:text-5xl">
            {component.name}.
          </h1>
          <p className="max-w-2xl text-pretty text-lg text-muted-foreground [&:not(:first-child)]:mt-0">
            {component.description}
          </p>
        </div>
      </header>

      {/* Tabbed Preview / Code */}
      <section
        aria-label={`${component.name} preview`}
        className="px-6 pb-12 lg:px-10"
      >
        <ComponentPreviewTabs component={component} />
      </section>

      {/* Related components — 4-card recommendation rail */}
      {related.length > 0 ? (
        <section
          aria-label="Related components"
          className="border-t border-border px-6 py-12 lg:px-10"
        >
          <header className="mb-6 flex items-baseline justify-between gap-4">
            <h2 className="text-heading-24 tracking-tight text-foreground !m-0">
              Related components
            </h2>
            <Link
              href={`/components/${category.slug}`}
              className="text-label-13 text-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline"
            >
              See all {category.name.toLowerCase()} →
            </Link>
          </header>
          <ul className="grid list-none grid-cols-1 gap-0 p-0 sm:grid-cols-2 lg:grid-cols-4 [&>li]:border-r [&>li]:border-b [&>li]:border-border [&>li:nth-child(2n)]:md:border-r-0 [&>li:nth-child(3n)]:lg:border-r-0 [&>li:nth-child(4n)]:lg:border-r-0 [&>li:nth-last-child(-n+2)]:md:border-b-0 [&>li:nth-last-child(-n+4)]:lg:border-b-0">
            {related.map((relatedComponent) => (
              <CatalogueCard
                key={relatedComponent.slug}
                component={relatedComponent}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </>
  )
}