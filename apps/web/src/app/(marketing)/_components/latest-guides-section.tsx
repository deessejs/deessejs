"use client"

import Link from "next/link"
import { useCallback, useState } from "react"
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@workspace/ui/components/carousel"
import { cn } from "@workspace/ui/lib/utils"

import { SectionHeader } from "@/app/(marketing)/_components/section-header"

/**
 * Client wrapper for the homepage LatestGuides section.
 *
 * Combines three responsibilities under a single `"use client"` boundary
 * so the prev/next buttons (which need access to the live carousel state)
 * can live in a border-t strip BELOW the carousel, right-aligned, while
 * the actual carousel sits between the `SectionHeader` and the strip:
 *
 *   1. Render the SectionHeader with a "See all guides" link on the
 *      RIGHT rail.
 *   2. Hold the Embla instance (`carouselApi`) at the boundary so the
 *      buttons in the bottom strip can call `scrollPrev()` / `scrollNext()`.
 *   3. Render the carousel track, the guide cards, and the bottom nav
 *      strip with the prev/next chevrons.
 *
 * Buttons carry `rounded-md` (not the default carousel `rounded-full`)
 * so the chrome reads as part of the homepage's shared-border rhythm
 * — same vocabulary as the buttons elsewhere on `/`.
 *
 * Layout breakpoints (cards visible at a time):
 *   • mobile (<md)  — full width, 1 visible
 *   • md            — basis-1/2, 2 visible
 *   • lg (≥1024px)  — basis-1/4, 4 visible
 *
 * Embla snap is `align: "start"` so the active card aligns flush with
 * the section's left edge. Loop is off — reaching the end stops on the
 * last card and the next button becomes disabled.
 *
 * 8 guides total — 4 visible at lg means 4 peek off-screen, giving the
 * section room to advertise the navigation without an explicit "next
 * 4" indicator.
 *
 * Pl-4 override: the shadcn `CarouselItem` ships with a default
 * `pl-4` (horizontal) to space adjacent slides. We don't want that
 * spacing here because each guide card already carries a `border-r`
 * for visual separation, and additional padding would make the track
 * look like a horizontal photo gallery. We override with `pl-0!` at
 * the call site so the default shadcn component stays untouched.
 *
 * Hero rotation: each card's image area is replaced with a real,
 * Shiki-highlighted code block rotated -3deg. The rotation lifts
 * to -1deg + scale-105 on hover via `group-hover:` utilities on
 * the inner wrapper. The class surface mirrors the popular
 * "rotated code card" pattern (Linear, Vercel examples gallery)
 * with the same corner-pin offsets (-mr-8 / -mb-8 push the bottom-
 * right corner past the card's outer padding so the rotated block
 * overflows into the gutter — a peeked, slightly tilted look that
 * gives the carousel kinetic energy without animation.
 */
type CarouselGuide = {
  slug: string
  title: string
  description: string
  url: string
  /** Pre-highlighted Shiki HTML for this guide's code snippet. */
  html: string
  /** True when a snippet entry existed for this slug in LATEST_GUIDES_SNIPPETS. */
  hasSnippet: boolean
}

function ChevronButton({
  direction,
  disabled,
  onClick,
  label,
}: {
  direction: "prev" | "next"
  disabled: boolean
  onClick: () => void
  label: string
}) {
  const Icon = direction === "prev" ? ArrowLeft : ArrowRight
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "inline-flex size-8 items-center justify-center border border-border bg-background text-foreground transition-colors rounded-md",
        "hover:bg-accent/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-40",
      )}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  )
}

export function LatestGuidesSection({
  guides,
}: {
  guides: ReadonlyArray<CarouselGuide>
}) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | undefined>(
    undefined,
  )
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const onSelect = useCallback((api: NonNullable<CarouselApi>) => {
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  const scrollPrev = useCallback(() => {
    carouselApi?.scrollPrev()
  }, [carouselApi])

  const scrollNext = useCallback(() => {
    carouselApi?.scrollNext()
  }, [carouselApi])

  const navStrip = (
    <>
      <ChevronButton
        direction="prev"
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        label="Previous guides"
      />
      <ChevronButton
        direction="next"
        disabled={!canScrollNext}
        onClick={scrollNext}
        label="Next guides"
      />
    </>
  )

  const rightAction = (
    <Link
      href="/knowledge-base"
      className="inline-flex items-center gap-1 text-label-13 text-foreground hover:underline underline-offset-4"
    >
      See all guides
      <ChevronRight className="size-3" aria-hidden />
    </Link>
  )

  return (
    <>
      <SectionHeader
        eyebrow="Latest guides"
        title=""
        bordered={false}
        action={rightAction}
      />
      <Carousel
        opts={{ align: "start", loop: false }}
        aria-label="Latest KB guides"
        setApi={(api) => {
          setCarouselApi(api)
          if (api) onSelect(api)
          api?.on("reInit", onSelect)
          api?.on("select", onSelect)
        }}
      >
        <CarouselContent>
          {guides.map((guide) => (
            <CarouselItem
              key={guide.slug}
              className="pl-0! md:basis-1/2 lg:basis-1/4"
            >
              <Link
                href={guide.url}
                className="group flex h-full flex-col border-r border-border transition-colors hover:bg-accent/40"
              >
                {/* Rotated Shiki hero */}
                <div className="border-y border-border bg-background p-4">
                  <div
                    aria-hidden
                    data-slot={`hero-${guide.slug}`}
                    className={cn(
                      "-rotate-3 origin-bottom-right",
                      "aspect-video overflow-hidden rounded-md border bg-background",
                    )}
                  >
                    {guide.hasSnippet ? (
                      <div
                        className="h-full overflow-hidden p-3 text-xs leading-relaxed [&_pre]:!bg-transparent [&_pre]:!p-0"
                        dangerouslySetInnerHTML={{ __html: guide.html }}
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-muted-foreground">
                        <span className="font-mono">// preview unavailable</span>
                      </div>
                    )}
                  </div>
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
          {navStrip}
        </div>
      </Carousel>
    </>
  )
}
