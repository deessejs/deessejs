import type { Metadata } from "next"

import { ComponentBrowser } from "@/app/(marketing)/components/_components/component-browser"
import { COMPONENT_CATEGORIES } from "@/app/(marketing)/components/_components/categories"
import {
  CATALOGUE_COMPONENTS,
  type CatalogueComponent,
} from "@/app/(marketing)/components/_components/components-list"

export const metadata: Metadata = {
  title: "Components",
  description:
    "Production-ready primitives every DeesseJS template ships with. Browse by category, copy any card for the detail page.",
}

/**
 * Components catalogue index at `/components`.
 *
 * Renders a hero + a sidebar + a grid of 3 category cards
 * (Buttons, Inputs, Badges). Each card links to the
 * per-category page where the 5 components live.
 *
 * The wrapper (border, bg, diagonal stripes) and the final 2-col
 * CTA come from `(marketing)/components/layout.tsx`.
 *
 *   ┌─ Hero ─────────────────────────┐
 *   └─ Browser (sidebar + grid) ─────┘
 */
export default function ComponentsPage() {
  // First component of each category drives the index card preview.
  const componentByCategory = Object.fromEntries(
    COMPONENT_CATEGORIES.map((category) => [
      category.id,
      CATALOGUE_COMPONENTS.find((c) => c.category === category.id),
    ]),
  ) as Record<(typeof COMPONENT_CATEGORIES)[number]["id"], CatalogueComponent>

  // Number of components per category — drives the sidebar count
  // badge.
  const counts = Object.fromEntries(
    COMPONENT_CATEGORIES.map((category) => [
      category.id,
      CATALOGUE_COMPONENTS.filter((c) => c.category === category.id).length,
    ]),
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
      <ComponentBrowser
        categories={COMPONENT_CATEGORIES}
        componentByCategory={componentByCategory}
        counts={counts}
      />
    </>
  )
}