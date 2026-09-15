import type { Metadata } from "next"

import { H1 } from "@workspace/ui/components/typography"

import { BlocksBrowser } from "./_components/blocks-browser"
import { BLOCK_CATEGORIES } from "./_components/block-categories"
import { BLOCK_CATALOGUE } from "./_components/blocks-list"
import { FooterCta } from "@/app/(marketing)/components/_components/footer-cta"

export const metadata: Metadata = {
  title: "Blocks",
  description:
    "Production-ready marketing sections. Hero, CTA, pricing, FAQ, and more. Drop them into any DeesseJS template.",
}

/**
 * Blocks catalogue index at `/blocks`.
 *
 * Layout: hero in its own card, then a gap, then the catalogue
 * grid in another card, then the footer CTA. Each card uses
 * `border border-border bg-background rounded-none` (calque of
 * `apps/web/src/app/(marketing)/page.tsx:515`) so the visual
 * rhythm matches the rest of the marketing site.
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
    <article className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 lg:py-24">
      {/* Hero card */}
      <header className="flex flex-col gap-6 border border-border bg-background rounded-none p-6 md:p-8 lg:p-10">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Blocks
        </p>
        <H1 className="text-heading-32 tracking-tight">Blocks.</H1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
          The marketing sections every DeesseJS template ships
          with. Browse by category, click any card for the detail
          page.
        </p>
      </header>

      {/* Catalogue card: sidebar + grid */}
      <div className="border border-border bg-background rounded-none">
        <BlocksBrowser
          blocks={BLOCK_CATALOGUE}
          categories={BLOCK_CATEGORIES}
        />
      </div>

      <FooterCta
        title="Read the source."
        body={
          <>
            Every block lives in{" "}
            <code className="font-mono text-foreground/90">apps/web</code>
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