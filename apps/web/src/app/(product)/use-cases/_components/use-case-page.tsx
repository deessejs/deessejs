import * as React from "react"
import Link from "next/link"
import { Check } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { Capability } from "../_data"

/**
 * Per-page hero for use-case pages.
 *
 * Structure (top to bottom):
 *   - eyebrow label  ("Use case · {category}")  + optional status badge
 *   - H1                                              (no tagline underneath)
 *   - primary + secondary CTA                         (shadcn <Button>)
 *   - optional capabilities grid                      (shared-border 2-col)
 *
 * The capabilities grid shows what's wired on day one AND what's shipping
 * next, each tagged with a status badge. This is the page's value prop:
 * the visitor sees the full scope, not a curated subset of the shipped
 * parts.
 */

type Variant = "default" | "dark"

type Cta = { label: string; href: string; external?: boolean }

export function UseCaseHero({
  category,
  title,
  status,
  primaryCta,
  secondaryCta,
  capabilities,
  variant = "default",
}: {
  category: string
  title: string
  status?: "shipped" | "coming-soon" | "beta"
  primaryCta: Cta
  secondaryCta?: Cta
  capabilities?: ReadonlyArray<Capability>
  variant?: Variant
}) {
  const isDark = variant === "dark"

  return (
    <section
      className={cn(
        "border-b border-border",
        isDark && "bg-zinc-950 text-zinc-100",
      )}
    >
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

        {capabilities && capabilities.length > 0 ? (
          <div className="flex flex-col gap-4 pt-4">
            <p
              className={cn(
                "text-label-13 uppercase tracking-wider",
                isDark ? "text-zinc-400" : "text-muted-foreground",
              )}
            >
              What&apos;s wired on day one — and what&apos;s shipping next.
            </p>
            <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-border md:grid-cols-2">
              {capabilities.map((c, idx) => (
                <CapabilityCell
                  key={c.id}
                  capability={c}
                  isLastInRow={idx % 2 === 1}
                  isLastRow={idx >= capabilities.length - 2}
                  isDark={isDark}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

/**
 * One cell of the capabilities grid. Cells share borders through a wrapping
 * border + per-cell borders so the grid stays solid regardless of count.
 */
function CapabilityCell({
  capability,
  isLastInRow,
  isLastRow,
  isDark,
}: {
  capability: Capability
  isLastInRow: boolean
  isLastRow: boolean
  isDark: boolean
}) {
  const c = capability
  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-6",
        // Vertical divider between cells in the same row (skip last in row)
        !isLastInRow && "md:border-r",
        // Horizontal divider between rows
        !isLastRow && "border-t md:border-t",
        isDark ? "border-zinc-800" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          className={cn(
            "text-heading-20 font-medium tracking-tight",
            isDark ? "text-zinc-50" : "text-foreground",
          )}
        >
          {c.title}
        </h3>
        {c.status === "shipped" ? (
          <Badge variant="success">
            <Check className="size-3" aria-hidden />
            Shipped
          </Badge>
        ) : (
          <Badge variant="outline">{c.shippedAt ?? "Roadmap"}</Badge>
        )}
      </div>
      <p
        className={cn(
          "text-copy-14 leading-6",
          isDark ? "text-zinc-400" : "text-muted-foreground",
        )}
      >
        {c.description}
      </p>
    </div>
  )
}
