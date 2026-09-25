import Link from "next/link"
import { ArrowRight, ChevronRight, Layers } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import { FlickeringGrid } from "@/app/(marketing)/_components/flickering-grid"

/**
 * Marketing homepage hero at `/`.
 *
 * Stacked layout (Infisical-style): H1 + badge pill on top, subtitle
 * + CTAs in a row below, then a 2:1 media placeholder. The
 * FlickeringGrid sits behind as background texture — same canvas used
 * on `/blog`, `/changelog`, `/knowledge-base` for visual continuity,
 * but the layout is unique to the homepage because the CTAs make
 * sense next to the title.
 *
 * Designed to be the only hero variant on `/`. The content pages use
 * the centered FlickeringGrid header pattern (see
 * `apps/web/src/app/(content)/blog/page.tsx`) — different layout,
 * shared background texture.
 */
export function Hero() {
  return (
    <div className="relative border-b border-border overflow-hidden">
      <FlickeringGrid
        className="absolute inset-0 z-0 opacity-60"
        squareSize={3}
        gridGap={5}
        flickerChance={0.15}
        maxOpacity={0.18}
        color="rgb(120, 120, 120)"
      />

      <div className="relative max-w-7xl mx-auto z-10 flex flex-col gap-6 lg:gap-8 px-8 py-12 lg:px-12 lg:py-16">
        {/* Top: H1 with the badge pill above it, left-aligned, full width */}
        <div className="flex flex-col items-start gap-5 lg:gap-6">
          <Link
            href="/blog/getting-started"
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 shadow-sm transition-colors hover:bg-accent/40"
          >
            <Layers className="text-foreground size-4 shrink-0" aria-hidden />
            <span className="truncate text-sm font-normal text-foreground">
              Introducing intelligent code generation
            </span>
            <ArrowRight
              className="size-3 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </Link>
          <h1 className="max-w-5xl text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
            The registry that shortens your time to production.
          </h1>
        </div>

        {/* Row: subtitle (left, ~4/7), spacer, CTAs (right, ~2/7) */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,_4fr)_minmax(0,_1fr)_minmax(0,_2fr)] items-end gap-6">
          <p className="text-muted-foreground text-copy-16 sm:text-copy-18 leading-7 max-w-2xl text-balance [&:not(:first-child)]:mt-0">
            Stop spending the first ten weeks rebuilding the same six
            services. Start where the actual product begins.
          </p>
          <div aria-hidden />
          <div className="flex flex-wrap items-center justify-start md:justify-end gap-3">
            <Button asChild size="lg">
              <Link href="/templates">Browse templates</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="bg-background hover:bg-accent/40"
            >
              <Link href="/contact">
                <ChevronRight className="size-3.5" aria-hidden />
                Talk to an expert
              </Link>
            </Button>
          </div>
        </div>

        {/* Media placeholder: 2:1 panel, full width, lighter background
            to mock the future central illustration without committing
            to a final design. */}
        <div
          aria-hidden
          className="relative w-full aspect-[2/1] border border-border bg-muted/40 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] bg-size-[12px_12px] opacity-60" />
        </div>
      </div>
    </div>
  )
}
