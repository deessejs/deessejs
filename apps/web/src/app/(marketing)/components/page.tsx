import type { Metadata } from "next"

import { H1 } from "@workspace/ui/components/typography"

import { CatalogueBrowser } from "@/app/(marketing)/components/_components/catalogue-browser"
import {
  COMPONENT_CATEGORIES,
} from "@/app/(marketing)/components/_components/categories"
import {
  CATALOGUE_COMPONENTS,
} from "@/app/(marketing)/components/_components/components-list"
import { FooterCta } from "@/app/(marketing)/components/_components/footer-cta"

export const metadata: Metadata = {
  title: "Components",
  description:
    "The production-ready primitives every DeesseJS template ships with. Browse the design system that powers the registry.",
}

/**
 * Components catalogue index at `/components`.
 *
 * Layout: hero in its own card, then a gap, then the catalogue
 * grid in another card, then the footer CTA. Each card uses
 * `border border-border bg-background rounded-none` (calque of
 * `apps/web/src/app/(marketing)/page.tsx:515`) so the visual
 * rhythm matches the rest of the marketing site — no floating
 * tiles, no double borders.
 *
 *   ┌─ Hero card ─────────────────────────┐
 *   ├─ gap ────────────────────────────────┤
 *   ├─ Catalogue card ─────────────────────┤
 *   │   ├─ sidebar (sticky)              │
 *   │   └─ grid (shared borders)         │
 *   └─ Footer CTA ─────────────────────────┘
 *
 * The browser component is a client component (`"use client"`)
 * that owns the checkbox state. Everything else here is RSC.
 *
 * V1 dummy: cards in the grid point to the leaf
 * `/components/[category]/[component]` placeholder pages. V2
 * auto-generates live previews from `packages/ui/src/components/*.tsx`.
 */
export default function ComponentsPage() {
  return (
    <article className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 lg:py-24">
      {/* Hero card */}
      <header className="flex flex-col gap-6 border border-border bg-background rounded-none p-6 md:p-8 lg:p-10">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Components
        </p>
        <H1 className="text-heading-32 tracking-tight">Components.</H1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
          The primitives every DeesseJS template ships with.
          Browse by category, click any card for the detail page.
        </p>
      </header>

      {/* Catalogue card: sidebar + grid */}
      <div className="border border-border bg-background rounded-none">
        <CatalogueBrowser
          components={CATALOGUE_COMPONENTS}
          categories={COMPONENT_CATEGORIES}
        />
      </div>

      <FooterCta
        title="Read the source."
        body={
          <>
            Every primitive lives in{" "}
            <code className="font-mono text-foreground/90">packages/ui</code>
            . MIT, no paywall.
          </>
        }
        primaryLabel="View on GitHub"
        primaryHref="https://github.com/deessejs/deessejs/tree/main/packages/ui"
        primaryExternal
        secondaryLabel="Browse templates"
        secondaryHref="/templates"
      />
    </article>
  )
}