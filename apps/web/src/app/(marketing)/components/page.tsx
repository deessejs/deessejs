import type { Metadata } from "next"

import { H1 } from "@workspace/ui/components/typography"
import { Separator } from "@workspace/ui/components/separator"

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
 * Layout:
 *   ┌─ Hero: title + lead ────────────────────────────────────┐
 *   ├─ <Separator /> ────────────────────────────────────────┤
 *   ├─ <CatalogueBrowser> — sidebar (6 checkboxes) + grid ──┤
 *   ├─ <Separator /> ────────────────────────────────────────┤
 *   └─ Footer CTA: read the source on GitHub ───────────────┘
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
    <article className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:py-24">
      {/* Hero */}
      <header className="flex flex-col gap-6">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Components
        </p>
        <H1>Components.</H1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
          The primitives every DeesseJS template ships with.
          Browse by category, click any card for the detail page.
        </p>
      </header>

      <Separator />

      {/* Sidebar + grid. Client component. */}
      <CatalogueBrowser
        components={CATALOGUE_COMPONENTS}
        categories={COMPONENT_CATEGORIES}
      />

      <Separator />

      <FooterCta />
    </article>
  )
}