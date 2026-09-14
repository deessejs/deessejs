import * as React from "react"
import Link from "next/link"
import { Check } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Per-page hero for use-case pages.
 *
 * Renders inside the page's shared-border wrapper (the same single card
 * that holds every other section on the page). The wrapper owns the
 * outer border; this component owns its content + an optional dark
 * background. No <section>, no border-b — the parent wrapper handles
 * separation between sections.
 *
 * Structure (top to bottom):
 *   - eyebrow label  ("Use case · {category}")  + optional status badge
 *   - H1                                              (no tagline underneath)
 *   - primary + secondary CTA                         (shadcn <Button>)
 *
 * The detailed capability story lives in the simulated sections
 * further down the page (auth, db, api, billing, cms, ...) and in the
 * "And more" grid - not in the hero.
 */

type Variant = "default" | "dark"

type Cta = { label: string; href: string; external?: boolean }

export function UseCaseHero({
  category,
  title,
  status,
  primaryCta,
  secondaryCta,
  variant = "default",
}: {
  category: string
  title: string
  status?: "shipped" | "coming-soon" | "beta"
  primaryCta: Cta
  secondaryCta?: Cta
  variant?: Variant
}) {
  const isDark = variant === "dark"

  return (
    <div className={cn(isDark && "bg-zinc-950 text-zinc-100")}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 sm:px-8 lg:py-24">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <p
              className={cn(
                "text-label-13 uppercase tracking-wider",
                isDark ? "text-zinc-400" : "text-muted-foreground",
              )}
            >
              Use case · {category}
            </p>
            {status === "coming-soon" ? (
              <Badge variant="warning">Coming soon</Badge>
            ) : status === "beta" ? (
              <Badge variant="outline">Beta</Badge>
            ) : status === "shipped" ? (
              <Badge variant="success">
                <Check className="size-3" aria-hidden />
                Shipped
              </Badge>
            ) : null}
          </div>

          <h1
            className={cn(
              "max-w-4xl text-heading-40 font-medium tracking-tight text-balance sm:text-heading-48 lg:text-heading-56",
              isDark ? "text-zinc-50" : "text-foreground",
            )}
          >
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild size="lg">
              {primaryCta.external ? (
                <a
                  href={primaryCta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {primaryCta.label}
                </a>
              ) : (
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
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
    </div>
  )
}
