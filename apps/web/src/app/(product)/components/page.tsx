import type { Metadata } from "next"

import { calculateCatalogCounts } from "@/components/catalog/catalog-counts"
import { CatalogBrowserShell } from "@/components/catalog/catalog-browser-shell"
import { CatalogCategoryGrid } from "@/components/catalog/catalog-category-grid"
import { CatalogSidebar } from "@/components/catalog/catalog-sidebar"
import { ComponentCardPreview } from "@/components/catalog/components/card-preview"
import { getComponentIcon } from "@/components/catalog/components/icons"
import { CATALOGUE_COMPONENTS } from "@/components/catalog/components/catalogue"
import { COMPONENT_CATEGORIES } from "@/components/catalog/components/categories"

export const metadata: Metadata = {
  title: "Components",
  description:
    "Production-ready primitives every DeesseJS template ships with. Browse by category, copy any card for the detail page.",
}

/**
 * Components catalogue index at `/components`.
 *
 * Two-column layout: nav sidebar on the left, category grid on
 * the right. Each grid card is one category (Buttons, Inputs,
 * Badges). The wrapper (border, bg, diagonal stripes) and the
 * final 2-col CTA come from `(product)/components/layout.tsx`.
 *
 * Inlined from the previously-separate `ComponentBrowser` and
 * `ComponentGrid` orchestrators. UI is identical.
 */
export default function ComponentsPage() {
  // First component of each category drives the index card preview.
  const componentByCategory = Object.fromEntries(
    COMPONENT_CATEGORIES.map((category) => [
      category.id,
      CATALOGUE_COMPONENTS.find((c) => c.category === category.id),
    ]),
  ) as Record<
    (typeof COMPONENT_CATEGORIES)[number]["id"],
    (typeof CATALOGUE_COMPONENTS)[number]
  >

  // Number of components per category — drives the sidebar count badge.
  const counts = calculateCatalogCounts(
    CATALOGUE_COMPONENTS,
    (component) => component.category,
  )

  return (
    <>
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="relative z-10 flex flex-col items-center gap-3 px-6 py-16 text-center sm:py-20 lg:py-24">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Components
          </p>
          <h1 className="text-heading-40 font-medium tracking-tight text-balance sm:text-heading-48 lg:text-heading-56">
            The design system, browsable.
          </h1>
          <p className="max-w-2xl text-copy-18 text-pretty leading-7 text-muted-foreground text-balance [&:not(:first-child)]:mt-0">
            Buttons, inputs, badges — the primitives every DeesseJS
            template ships with. Click any card for the detail page.
          </p>
        </div>
      </header>

      {/* Two-column browser: sidebar + category grid. */}
      <CatalogBrowserShell
        ariaLabel="Components catalogue"
        withBottomBorder
        sidebar={
          <CatalogSidebar
            heading="Categories"
            basePath="/components"
            entries={COMPONENT_CATEGORIES}
            counts={counts}
          />
        }
      >
        <CatalogCategoryGrid
          columns={3}
          entries={COMPONENT_CATEGORIES.flatMap((category) => {
            const component = componentByCategory[category.id]
            if (!component) return []
            const Icon = getComponentIcon(component.slug)
            return [
              {
                id: category.id,
                href: `/components/${category.slug}`,
                ariaLabel: `Browse the ${category.name} category`,
                preview: <ComponentCardPreview slug={component.slug} />,
                title: (
                  <div className="flex items-start gap-3">
                    <Icon
                      aria-hidden
                      className="text-muted-foreground mt-0.5 size-4 shrink-0"
                    />
                    <span>{category.name}</span>
                  </div>
                ),
                description: category.description,
              },
            ]
          })}
        />
      </CatalogBrowserShell>
    </>
  )
}
