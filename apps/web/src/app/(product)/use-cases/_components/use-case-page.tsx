import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { FlickeringGrid } from "@/app/(marketing)/_components/flickering-grid"

/**
 * Per-page hero for use-case pages, aligned with the marketing site
 * pattern (Homepage / Pricing / Enterprise / Delivery).
 *
 * Same visual signature as the rest of the marketing surface:
 *   - FlickeringGrid background canvas (full bleed)
 *   - Centered eyebrow ("Use case · {category}") + optional status
 *     badge
 *   - Centered H1 (scale `heading-40 → 56` on lg)
 *   - Optional supporting body copy
 *   - Primary CTA + optional secondary CTA
 *
 * The wrapper renders inside the page's shared-border card. The card
 * owns the outer border; this component adds the bottom border-b so
 * the section divider matches every other section on the page.
 */

type Variant = "default" | "dark"

type Cta = { label: string; href: string; external?: boolean }

export function UseCaseHero({
  category,
  title,
  body,
  primaryCta,
  secondaryCta,
  variant = "default",
}: {
  category: string
  title: string
  /** Optional supporting body copy between the title and the CTAs. */
  body?: string
  primaryCta: Cta
  secondaryCta?: Cta
  variant?: Variant
}) {
  const isDark = variant === "dark"

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

      <div
        className={cn(
          "relative z-10 flex flex-col items-center gap-6 px-6 py-16 text-center sm:py-20 lg:py-24",
          isDark && "text-zinc-100",
        )}
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <p
            className={cn(
              "text-label-13 uppercase tracking-wider",
              isDark ? "text-zinc-400" : "text-muted-foreground",
            )}
          >
            Use case · {category}
          </p>
        </div>

        <h1
          className={cn(
            "max-w-4xl text-heading-40 font-medium tracking-tight text-balance sm:text-heading-48 lg:text-heading-56 [&:not(:first-child)]:mt-0",
            isDark ? "text-zinc-50" : "text-foreground",
          )}
        >
          {title}
        </h1>

        {body ? (
          <p
            className={cn(
              "max-w-2xl text-copy-18 leading-7 text-balance [&:not(:first-child)]:mt-0",
              isDark ? "text-zinc-300" : "text-muted-foreground",
            )}
          >
            {body}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild size="lg">
            {primaryCta.external ? (
              <a
                href={primaryCta.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {primaryCta.label}
                <ChevronRight className="size-3.5" aria-hidden />
              </a>
            ) : (
              <Link href={primaryCta.href}>
                {primaryCta.label}
                <ChevronRight className="size-3.5" aria-hidden />
              </Link>
            )}
          </Button>
          {secondaryCta ? (
            <Button asChild size="lg" variant="outline">
              {secondaryCta.external ? (
                <a
                  href={secondaryCta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {secondaryCta.label}
                </a>
              ) : (
                <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
