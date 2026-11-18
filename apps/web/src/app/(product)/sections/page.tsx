import type { Metadata } from "next"

import { calculateCatalogCounts } from "@/components/catalog/catalog-counts"
import { CatalogBrowserShell } from "@/components/catalog/catalog-browser-shell"
import { CatalogCategoryGrid } from "@/components/catalog/catalog-category-grid"
import { CatalogSidebar } from "@/components/catalog/catalog-sidebar"
import { SectionCardPreview } from "@/components/catalog/sections/card-preview"
import { SECTION_CATEGORIES } from "@/components/catalog/sections/categories"
import { SECTION_CATALOGUE } from "@/components/catalog/sections/catalogue"

export const metadata: Metadata = {
  title: "Sections",
  description:
    "Production-ready marketing sections. Hero, CTA, pricing, FAQ, and more. Drop them into any DeesseJS template.",
}

/**
 * Sections catalogue index at `/sections`.
 *
 * Two-column layout: nav sidebar on the left, category grid on
 * the right. Each grid card is one category (Hero, CTA, Feature,
 * Pricing, Testimonial, Stats, FAQ, Footer) with a layout-shaped
 * preview.
 *
 * Wrapper + final CTA from `(product)/sections/layout.tsx`.
 *
 * Inlined from the previously-separate `SectionsBrowser` and
 * `SectionsCategoryGrid` orchestrators. UI is identical.
 */
export default function SectionsPage() {
  // Map each category to a representative section.
  const categoryToSection = new Map(
    SECTION_CATEGORIES.flatMap((category) => {
      const firstSection = SECTION_CATALOGUE.find(
        (section) => section.category === category.id
      )
      return firstSection ? [[category.id, firstSection] as const] : []
    })
  )

  // Per-category counts.
  const counts = calculateCatalogCounts(
    SECTION_CATALOGUE,
    (section) => section.category
  )

  return (
    <>
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="relative z-10 flex flex-col items-center gap-3 px-6 py-16 text-center sm:py-20 lg:py-24">
          <p className="text-label-13 tracking-wider text-muted-foreground uppercase">
            Sections
          </p>
          <h1 className="text-heading-40 font-medium tracking-tight text-balance sm:text-heading-48 lg:text-heading-56">
            Marketing sections, ready to drop in.
          </h1>
          <p className="max-w-2xl text-copy-18 leading-7 text-balance text-pretty text-muted-foreground [&:not(:first-child)]:mt-0">
            The marketing sections every DeesseJS template ships with. Browse a
            category, click any card for the detail page.
          </p>
        </div>
      </header>

      {/* Two-column browser: sidebar + category grid. */}
      <CatalogBrowserShell
        ariaLabel="Sections catalogue"
        sidebar={
          <CatalogSidebar
            heading="Categories"
            basePath="/sections"
            entries={SECTION_CATEGORIES}
            counts={counts}
          />
        }
      >
        <CatalogCategoryGrid
          columns={4}
          entries={SECTION_CATEGORIES.flatMap((category) => {
            const section = categoryToSection.get(category.id)
            if (!section) return []
            return [
              {
                id: category.id,
                href: `/sections/${category.slug}`,
                ariaLabel: `Browse the ${category.name} category`,
                preview: <SectionCardPreview section={section} />,
                title: category.name,
                description: category.description,
                footer: (
                  <span className="font-mono text-label-13 text-muted-foreground">
                    {category.sectionNames.split(",")[0]?.trim()}
                  </span>
                ),
              },
            ]
          })}
        />
      </CatalogBrowserShell>
    </>
  )
}
