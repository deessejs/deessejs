import Link from "next/link"
import { H1 } from "@workspace/ui/components/typography"
import { Separator } from "@workspace/ui/components/separator"

import type { ComponentCategory } from "./categories"
import { FooterCta } from "./footer-cta"
import { CategorySearchableList } from "./category-searchable-list"
import {
  CATALOGUE_COMPONENTS,
  type CatalogueComponent,
} from "./components-list"

type Props = {
  category: ComponentCategory
}

/**
 * Shared body for `/components/[category]`.
 *
 * Layout: hero (eyebrow + H1 + lead) + `<Separator>` + two-column
 * section with `<CategorySearchableList>` on the left (searchable
 * list of links to the leaf pages) and a placeholder zone on the
 * right + `<Separator>` + `<FooterCta>`.
 *
 * The right zone is intentionally placeholder copy in V1 dummy —
 * it tells the visitor that the sidebar list is the affordance,
 * not a grid they'll see on the right.
 */
export function CategoryPage({ category }: Props) {
  const items: ReadonlyArray<CatalogueComponent> = CATALOGUE_COMPONENTS.filter(
    (component) => component.category === category.id,
  )

  return (
    <article className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:py-24">
      {/* Hero */}
      <header className="flex flex-col gap-6">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          {category.name}
        </p>
        <H1>{category.name}.</H1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
          {category.description}
        </p>
      </header>

      <Separator />

      {/* Sidebar list (left) + placeholder zone (right) */}
      <section
        aria-labelledby="catalogue-heading"
        className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12"
      >
        <h2 id="catalogue-heading" className="sr-only">
          {category.name} components
        </h2>
        <CategorySearchableList components={items} category={category} />
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-64 flex-col items-start justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-8"
        >
          <p className="text-heading-20 tracking-tight text-foreground !m-0">
            Pick a component on the left.
          </p>
          <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
            The {items.length} {category.name.toLowerCase()} components are
            listed in the sidebar. Select one to see its detail page.
          </p>
          <Link
            href="/components"
            className="text-label-13 text-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline"
          >
            ← Back to the full catalogue
          </Link>
        </div>
      </section>

      <Separator />

      <FooterCta
        title={`Read the ${category.name.toLowerCase()} source.`}
        body={
          <>
            Browse the primitives in{" "}
            <code className="font-mono text-foreground/90">packages/ui</code>
            . MIT, no paywall.
          </>
        }
      />
    </article>
  )
}