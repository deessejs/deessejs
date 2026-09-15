import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { H1 } from "@workspace/ui/components/typography"
import { Separator } from "@workspace/ui/components/separator"
import { Button } from "@workspace/ui/components/button"

import type { CatalogueComponent } from "./components-list"
import type { ComponentCategory } from "./categories"
import { CatalogueCard } from "./catalogue-card"
import { ComponentPreviewTabs } from "./component-preview-tabs"
import { getRelatedComponents } from "./components-list"

type Props = {
  component: CatalogueComponent
  category: ComponentCategory
}

const COMPONENTS_REPO_URL =
  "https://github.com/deessejs/deessejs/tree/main/packages/ui/components"

/**
 * Shared body for every `/components/[category]/[component]` page.
 *
 * Layout: hero, tabbed Preview/Code surface, Related components
 * rail (4 cards, same-category siblings with fallback), footer
 * CTA. V2 will add an Anatomy tab and swap inline code for
 * Shiki highlighting.
 */
export function ComponentPage({ component, category }: Props) {
  const related = getRelatedComponents(component.slug, 4)

  return (
    <article className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:py-24">
      {/* Hero */}
      <header className="flex flex-col gap-6">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          {category.name}
        </p>
        <H1>{component.name}.</H1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
          {component.description}
        </p>
      </header>

      <Separator />

      {/* Tabbed Preview / Code */}
      <section
        aria-label={`${component.name} preview`}
        className="flex flex-col gap-4"
      >
        <ComponentPreviewTabs component={component} />
      </section>

      <Separator />

      {/* Related components — 4-card recommendation rail */}
      {related.length > 0 ? (
        <section
          aria-label="Related components"
          className="flex flex-col gap-4"
        >
          <header className="flex items-baseline justify-between gap-4">
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

      <Separator />

      {/* Footer CTA — "back to the category" + "view on GitHub" */}
      <section
        aria-labelledby="cta-heading"
        className="flex flex-col items-start gap-6 rounded-lg border border-border bg-muted/30 p-8 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex flex-col gap-2">
          <h2
            id="cta-heading"
            className="text-heading-24 tracking-tight text-foreground !m-0"
          >
            Browse the {category.name.toLowerCase()} catalogue.
          </h2>
          <p className="text-copy-14 text-muted-foreground [&:not(:first-child)]:mt-0">
            All {category.name.toLowerCase()} primitives live in{" "}
            <code className="font-mono text-foreground/90">packages/ui</code>
            . MIT, no paywall.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline">
            <Link href={`/components/${category.slug}`}>
              Back to {category.name}
            </Link>
          </Button>
          <Button asChild>
            <a
              href={COMPONENTS_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </Button>
        </div>
      </section>
    </article>
  )
}
