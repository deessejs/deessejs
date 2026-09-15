import { H1 } from "@workspace/ui/components/typography"

import type { BlockCategory } from "./block-categories"
import { BLOCK_CATEGORIES } from "./block-categories"
import { BlocksCategoryBrowser } from "./blocks-category-browser"
import { FooterCta } from "@/app/(marketing)/components/_components/footer-cta"
import { BLOCK_CATALOGUE } from "./blocks-list"

type Props = {
  category: BlockCategory
}

/**
 * Shared body for `/blocks/[category]`.
 *
 * Layout: hero card, gap, catalogue card with `<BlocksCategoryBrowser>`,
 * gap, footer CTA. Each section lives in its own
 * `border border-border bg-background rounded-none` card (calque of
 * `apps/web/src/app/(marketing)/page.tsx:515`).
 *
 * Mirror of `CategoryPage` in the components registry.
 */
export function BlocksCategoryPage({ category }: Props) {
  return (
    <article className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 lg:py-24">
      {/* Hero card */}
      <header className="flex flex-col gap-6 border border-border bg-background rounded-none p-6 md:p-8 lg:p-10">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          {category.name}
        </p>
        <H1 className="text-heading-32 tracking-tight">{category.name}.</H1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
          {category.description}
        </p>
      </header>

      {/* Catalogue card: nav sidebar + grid of blocks in this category */}
      <div className="border border-border bg-background rounded-none p-6 md:p-8 lg:p-10">
        <BlocksCategoryBrowser
          blocks={BLOCK_CATALOGUE}
          categories={BLOCK_CATEGORIES}
          pinnedCategory={category.id}
        />
      </div>

      <FooterCta
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
        primaryLabel="View on GitHub"
        primaryHref="https://github.com/deessejs/deessejs"
        primaryExternal
        secondaryLabel="Browse templates"
        secondaryHref="/templates"
      />
    </article>
  )
}