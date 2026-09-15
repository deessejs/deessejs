import Link from "next/link"

import { H1 } from "@workspace/ui/components/typography"
import { Separator } from "@workspace/ui/components/separator"

import type { BlockCategory } from "./block-categories"
import { BlocksFooterCta } from "./blocks-footer-cta"
import { BlocksSearchableList } from "./blocks-searchable-list"
import {
  BLOCK_CATALOGUE,
  type CatalogueBlock,
} from "./blocks-list"

type Props = {
  category: BlockCategory
}

/**
 * Shared body for `/blocks/[category]`.
 *
 * Layout: hero (eyebrow + H1 + lead) + `<Separator>` + two-column
 * section with `<BlocksSearchableList>` on the left and a
 * placeholder zone on the right + `<Separator>` + `<BlocksFooterCta>`.
 *
 * Mirror of `CategoryPage` in the components registry.
 */
export function BlocksCategoryPage({ category }: Props) {
  const items: ReadonlyArray<CatalogueBlock> = BLOCK_CATALOGUE.filter(
    (block) => block.category === category.id,
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
          {category.name} blocks
        </h2>
        <BlocksSearchableList blocks={items} category={category} />
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-64 flex-col items-start justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-8"
        >
          <p className="text-heading-20 tracking-tight text-foreground !m-0">
            Pick a block on the left.
          </p>
          <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
            The {items.length} {category.name.toLowerCase()} blocks are
            listed in the sidebar. Select one to see its detail page.
          </p>
          <Link
            href="/blocks"
            className="text-label-13 text-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline"
          >
            ← Back to the full catalogue
          </Link>
        </div>
      </section>

      <Separator />

      <BlocksFooterCta
        title={`Read the ${category.name.toLowerCase()} source.`}
        body={
          <>
            Browse the blocks in{" "}
            <code className="font-mono text-foreground/90">
              apps/web
            </code>
            . MIT, no paywall.
          </>
        }
      />
    </article>
  )
}