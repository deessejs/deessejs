"use client"

import Link from "next/link"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"

/**
 * Client-only carousel wrapper for the homepage LatestGuides section.
 *
 * Reads a serialised `guides` payload from the parent (a Server Component
 * that pulls from `content-collections` at build time). The carousel
 * holds the runtime state — Embla instance, canScrollPrev/Next,
 * keyboard handlers — while each slide is a regular `<Link>` to the
 * guide detail page.
 *
 * Layout breakpoints (cards visible at a time):
 *   • mobile (<md)  — full width, 1 visible
 *   • md            — basis-1/2, 2 visible
 *   • lg (≥1024px)  — basis-1/4, 4 visible
 *
 * Embla snap is `align: "start"` so the active card aligns flush with
 * the section's left edge.
 *
 * The shadcn wrapper renders prev/next absolutely-positioned beside the
 * track. We override that — the buttons sit on a row below the carousel,
 * right-aligned, framed by a `border-t` that closes the section's
 * shared-border rail. The overrides (`static! top-auto! left-auto!
 * -translate-y-0!`) neutralise the wrapper's absolute positioning so
 * the buttons participate in normal flow inside the nav strip.
 *
 * 8 guides total — 4 visible at lg means 4 peek off-screen, giving the
 * section room to advertise the navigation without an explicit "next
 * 4" indicator.
 */
type CarouselGuide = {
  slug: string
  title: string
  description: string
  url: string
}

export function LatestGuidesCarousel({
  guides,
}: {
  guides: ReadonlyArray<CarouselGuide>
}) {
  return (
    <Carousel
      opts={{ align: "start", loop: false }}
      aria-label="Latest KB guides"
    >
      <CarouselContent className="px-6 lg:px-10">
        {guides.map((guide) => (
          <CarouselItem
            key={guide.slug}
            className="md:basis-1/2 lg:basis-1/4"
          >
            <Link
              href={guide.url}
              className="group flex h-full flex-col border-r border-border transition-colors hover:bg-accent/40"
            >
              {/* Placeholder thumbnail (mockup for now) */}
              <div
                aria-hidden
                className="relative aspect-[16/9] border-b border-border bg-muted/40 overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] bg-size-[12px_12px] opacity-60" />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-6 lg:p-8">
                <span className="font-mono uppercase text-[0.8125rem] leading-[1.2] text-foreground opacity-64 font-medium tracking-[-0.01em]">
                  Guide
                </span>
                <h3 className="text-heading-20 tracking-tight text-foreground !m-0 text-balance lg:text-heading-24">
                  {guide.title}
                </h3>
                <p className="text-copy-14 text-muted-foreground leading-6 !m-0 text-balance">
                  {guide.description}
                </p>
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4 lg:px-10">
        <CarouselPrevious className="static! top-auto! left-auto! -translate-y-0! size-8 rounded-full" />
        <CarouselNext className="static! top-auto! left-auto! -translate-y-0! size-8 rounded-full" />
      </div>
    </Carousel>
  )
}
