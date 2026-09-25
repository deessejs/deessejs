import type { ComponentCategory } from "./categories"
import { ComponentCategoryBrowser } from "./component-category-browser"
import { CATALOGUE_COMPONENTS } from "./components-list"

type Props = {
  category: ComponentCategory
}

/**
 * Shared body for `/components/[category]`.
 *
 * Two-column layout, mirror of `/blocks/[category]`:
 *   - **Left**: nav sidebar listing every component in this
 *     category. Each link goes to that component's leaf page.
 *   - **Right**: grid of cards, each linked to its leaf page.
 *
 * The wrapper + final CTA live in `(marketing)/components/layout.tsx`.
 * The leaf route at `/components/[category]/[component]` uses its
 * own body — `ComponentPage` is for the category index only.
 */
export function ComponentPage({ category }: Props) {
  const components = CATALOGUE_COMPONENTS.filter(
    (component) => component.category === category.id,
  )

  return (
    <>
      {/* Hero — left-aligned, category-specific copy. */}
      <header className="border-b border-border px-6 py-16 lg:px-10 lg:py-20">
        <div className="flex flex-col gap-3">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            {category.name}
          </p>
          <h1 className="text-heading-40 font-medium tracking-tight text-balance">
            {category.name}.
          </h1>
          <p className="max-w-2xl text-copy-18 text-pretty leading-7 text-muted-foreground text-balance [&:not(:first-child)]:mt-0">
            {category.description}
          </p>
        </div>
      </header>

      {/* Two-column browser: nav sidebar + grid of components */}
      <ComponentCategoryBrowser
        components={components}
        category={category}
      />
    </>
  )
}

/**
 * Reusable hero used by the leaf route at
 * `/components/[category]/[component]`. Same shape as the
 * category-page hero, with a slot for the component-specific
 * eyebrow text (so the leaf can prefix with the component
 * category).
 */
export function ComponentLeafHero({
  category,
  component,
}: {
  category: ComponentCategory
  component: { name: string }
}) {
  return (
    <header className="border-b border-border px-6 py-16 lg:px-10 lg:py-20">
      <div className="flex flex-col gap-3">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          {category.name}
        </p>
        <h1 className="text-heading-40 font-medium tracking-tight text-balance">
          {component.name}.
        </h1>
        <p className="max-w-2xl text-copy-18 text-pretty leading-7 text-muted-foreground text-balance [&:not(:first-child)]:mt-0">
          {category.description}
        </p>
      </div>
    </header>
  )
}