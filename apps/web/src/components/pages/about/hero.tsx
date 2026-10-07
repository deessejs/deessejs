import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

/**
 * /about page hero.
 *
 * Centered hero matching the recipe used by /pricing and
 * /enterprise (`flex flex-col items-center gap-6
 * border-b border-border px-6 py-16 text-center sm:py-20
 * lg:py-24` outer + `max-w-3xl` inner column). Header and lead
 * follow the standardized recipe (H1 `text-heading-40
 * sm:text-heading-48 lg:text-heading-56 font-medium
 * tracking-tight text-balance`, lead `text-muted-foreground
 * text-copy-18 sm:text-copy-20 leading-7 max-w-2xl
 * text-balance`).
 *
 * Copy benchmarked against vercel.com/about:
 * - The eyebrow is dropped. /vercel.com/about opens directly
 *   on the H1 — a senior about-page uses the H1 as the
 *   opening line, not a category label.
 * - The H1 "Templates that ship themselves." is the same
 *   pull-quote used by the Beyond horizon item on /vision
 *   and by the manifesto belief 03. Re-using it on /about
 *   ties the three pages together under one tagline.
 * - The lead states what DeesseJS is (open template
 *   ecosystem for agent-aware apps), who builds it (the
 *   team behind the engine), and what you get (MIT,
 *   runnable from first commit). Three short sentences, no
 *   marketing superlatives, no internal-org reference — we
 *   don't open an about-page by talking about the org.
 * - Two CTAs center-aligned to match the centered text
 *   recipe: primary "Browse templates" (self-serve funnel),
 *   outline secondary "Talk to delivery" (engagement
 *   funnel). They sit inside the hero's border-b so the
 *   FinalCta below remains the only full-width band on the
 *   page.
 *
 * No meta row on /about (evergreen copy, not time-bound).
 */
export function Hero() {
  return (
    <section className="flex flex-col items-center gap-6 border-b border-border px-6 py-16 text-center sm:py-20 lg:py-24">
      <div className="flex max-w-3xl flex-col items-center gap-6">
        <h1 className="text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance">
          Templates that ship themselves.
        </h1>
        <p className="text-muted-foreground text-copy-18 sm:text-copy-20 leading-7 max-w-2xl text-balance [&:not(:first-child)]:mt-0">
          DeesseJS is the open template ecosystem for agent-aware
          apps. Built by the team behind the engine, every template
          ships MIT and is runnable from the first commit.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 [&:not(:first-child)]:mt-0">
          <Button asChild size="lg">
            <Link href="/templates">Browse templates</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/delivery">Talk to delivery</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
