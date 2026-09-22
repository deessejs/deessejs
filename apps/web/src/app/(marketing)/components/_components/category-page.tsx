import { H1 } from "@workspace/ui/components/typography"

import type { ComponentCategory } from "./categories"
import { CategoryBrowser } from "./category-browser"
import { CATALOGUE_COMPONENTS } from "./components-list"
import { COMPONENT_CATEGORIES } from "./categories"

type Props = {
  category: ComponentCategory
}

/**
 * Shared body for `/components/[category]`.
 *
 * Wrapper + final CTA from `(marketing)/components/layout.tsx`.
 * This file only renders the hero (with category-specific copy)
 * and the category browser.
 */
export function CategoryPage({ category }: Props) {
  return (
    <>
      {/* Hero — left-aligned (category-specific eyebrow + H1) */}
      <header className="border-b border-border px-6 py-16 lg:px-10 lg:py-20">
        <div className="flex flex-col gap-3">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            {category.name}
          </p>
          <H1 className="text-heading-40 font-medium tracking-tight text-balance">
            {category.name}.
          </H1>
          <p className="max-w-2xl text-copy-18 text-pretty leading-7 text-muted-foreground text-balance [&:not(:first-child)]:mt-0">
            {category.description}
          </p>
        </div>
      </header>

      {/* Catalogue: nav sidebar + grid */}
      <CategoryBrowser
        components={CATALOGUE_COMPONENTS}
        categories={COMPONENT_CATEGORIES}
        pinnedCategory={category.id}
      />
    </>
  )
}