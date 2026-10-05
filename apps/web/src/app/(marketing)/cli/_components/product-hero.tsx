import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import { FlickeringGrid } from "@/app/(marketing)/_components/flickering-grid"

/**
 * Per-page hero for product pages on the marketing site (e.g. /cli).
 *
 * Same visual signature as `<UseCaseHero>` (full-bleed FlickeringGrid
 * background, centered eyebrow + H1 + body + primary CTA + optional
 * secondary CTA) but the eyebrow is **not** hardcoded — the caller
 * supplies the full string ("Product · CLI", "Docs · Registry", …)
 * because product pages do not share a common prefix the way
 * use-case pages do.
 *
 * The wrapper renders inside the page's shared-border card. The card
 * owns the outer border; this component adds the bottom `border-b`
 * so the section divider matches every other section on the page.
 */
type Cta = { label: string; href: string; external?: boolean }

export function ProductHero({
  eyebrow,
  title,
  body,
  primaryCta,
  secondaryCta,
}: {
  eyebrow: string
  title: string
  /** Optional supporting body copy between the title and the CTAs. */
  body?: string
  primaryCta: Cta
  secondaryCta?: Cta
}) {
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

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 py-16 text-center sm:py-20 lg:py-24">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>

        <h1 className="max-w-4xl text-heading-40 font-medium tracking-tight text-balance text-foreground sm:text-heading-48 lg:text-heading-56">
          {title}
        </h1>

        {body ? (
          <p className="max-w-2xl text-copy-18 leading-7 text-balance text-muted-foreground [&:not(:first-child)]:mt-0">
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
