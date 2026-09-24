import Link from "next/link"

import { KbCardGrid } from "@/components/knowledge-base/kb-card-grid"

import { TRUST_BADGES } from "@/lib/enterprise/trust-badges"

/**
 * Trust and compliance grid for the /enterprise page.
 *
 * Three cells, three-col grid on md+. Each cell renders a
 * verifiable claim only — no fabricated SOC 2 / ISO 27001
 * badges. The eyebrow + heading pair rides above the grid inside
 * a full-width band, matching the homepage section header recipe.
 *
 * Border strategy (Pattern C from `.claude/skills/tailwind-borders`):
 * the shared `KbCardGrid` paints the wrapper with `bg-border`,
 * lets `gap-px` carry the separator between cells, and per-cell
 * `bg-background` covers the inside. This handles the last-row
 * short-cell case correctly (no dropped right border) and avoids
 * the Pattern A (per-position border-r) arithmetic that the
 * previous divide-* implementation required.
 *
 * Outer `border-b border-border` matches the divider on every
 * other section of the page.
 */
export function TrustAndCompliance() {
  return (
    <div className="border-b border-border">
      <div className="flex flex-col gap-6 p-6 lg:p-10">
        <header className="flex flex-col gap-2">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Trust and compliance
          </p>
          <h2 className="text-heading-24 lg:text-heading-32 tracking-tight text-balance [&:not(:first-child)]:mt-0">
            Procurement paperwork fast-tracked, not stalled.
          </h2>
        </header>
        <KbCardGrid className="md:grid-cols-3">
          {TRUST_BADGES.map((badge) => (
            <div
              key={badge.label}
              className="flex flex-col gap-1 bg-background p-5 transition-colors hover:bg-accent/40 lg:p-6"
            >
              <span className="text-heading-16 font-semibold tracking-tight text-foreground">
                {badge.label}
              </span>
              <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
                {badge.detail}{" "}
                <Link
                  href={badge.href}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  Request
                </Link>
              </p>
            </div>
          ))}
        </KbCardGrid>
      </div>
    </div>
  )
}
