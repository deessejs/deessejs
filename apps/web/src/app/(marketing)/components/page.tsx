import type { Metadata } from "next"

import { CatalogueBrowser } from "@/app/(marketing)/components/_components/catalogue-browser"
import {
  COMPONENT_CATEGORIES,
} from "@/app/(marketing)/components/_components/categories"
import {
  CATALOGUE_COMPONENTS,
} from "@/app/(marketing)/components/_components/components-list"

export const metadata: Metadata = {
  title: "Components",
  description:
    "The production-ready primitives every DeesseJS template ships with. Browse the design system that powers the registry.",
}

/**
 * Components catalogue index at `/components`.
 *
 * Two-column layout: nav sidebar on the left, category grid on
 * the right. The sidebar links to each category page; the grid
 * shows one card per category (one component per category in the
 * V1 1-category-per-component taxonomy).
 *
 * The `MarketingPage` wrapper (border, bg, diagonal stripes) and
 * the final 2-col CTA are provided by `(marketing)/components/layout.tsx`.
 *
 *   ┌─ Hero ──────────────────────────┐
 *   └─ Browser (sidebar + grid) ──────┘
 *
 * Calque of the hero pattern in `(content)/blog/page.tsx:26-55`:
 * eyebrow + responsive H1 + lead, all centred.
 */
export default function ComponentsPage() {
  // Build the category → component map (each category has exactly
  // one component in the V1 taxonomy, but we map by category.id
  // so the structure is forward-compatible with grouped taxonomy).
  const categoryToComponent = Object.fromEntries(
    CATALOGUE_COMPONENTS.map((component) => [component.category, component]),
  ) as Record<(typeof COMPONENT_CATEGORIES)[number]["id"], (typeof CATALOGUE_COMPONENTS)[number]>

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
            The primitives every DeesseJS template ships with.
            Browse a category, click any card for the detail page.
          </p>
        </div>
      </header>

      {/* Two-column browser: sidebar + category grid. */}
      <CatalogueBrowser
        categories={COMPONENT_CATEGORIES}
        categoryToComponent={categoryToComponent}
      />
    </>
  )
}