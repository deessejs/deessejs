import type { Metadata } from "next"

import { H1 } from "@workspace/ui/components/typography"
import { Separator } from "@workspace/ui/components/separator"

import { BlocksBrowser } from "./_components/blocks-browser"
import { BLOCK_CATEGORIES } from "./_components/block-categories"
import { BLOCK_CATALOGUE } from "./_components/blocks-list"
import { BlocksFooterCta } from "./_components/blocks-footer-cta"

export const metadata: Metadata = {
  title: "Blocks",
  description:
    "Production-ready marketing sections. Hero, CTA, pricing, FAQ, and more. Drop them into any DeesseJS template.",
}

/**
 * Blocks catalogue index at `/blocks`.
 *
 * Layout:
 *   ┌─ Hero: title + lead ────────────────────────────────┐
 *   ├─ <Separator /> ────────────────────────────────────┤
 *   ├─ <BlocksBrowser> — sidebar (8 checkboxes) + grid ──┤
 *   ├─ <Separator /> ────────────────────────────────────┤
 *   └─ Footer CTA: read the source on GitHub ─────────────┘
 *
 * The browser component is a client component (`"use client"`)
 * that owns the checkbox state. Everything else here is RSC.
 *
 * V1 dummy: cards in the grid point to the leaf
 * `/blocks/[category]/[block]` placeholder pages. V2
 * auto-generates live previews from a JSDoc-tagged source.
 */
export default function BlocksPage() {
  return (
    <article className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:py-24">
      {/* Hero */}
      <header className="flex flex-col gap-6">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Blocks
        </p>
        <H1>Blocks.</H1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
          The marketing sections every DeesseJS template ships
          with. Browse by category, click any card for the detail
          page.
        </p>
      </header>

      <Separator />

      {/* Sidebar + grid. Client component. */}
      <BlocksBrowser
        blocks={BLOCK_CATALOGUE}
        categories={BLOCK_CATEGORIES}
      />

      <Separator />

      <BlocksFooterCta />
    </article>
  )
}