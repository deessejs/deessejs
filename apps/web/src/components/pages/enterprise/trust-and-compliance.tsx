import { cn } from "@workspace/ui/lib/utils"

import Link from "next/link"

import { TRUST_BADGES } from "@/lib/enterprise/trust-badges"

/**
 * Trust and compliance grid for the /enterprise page.
 *
 * Three cells, three-col grid on md+. Each cell renders a
 * verifiable claim only — no fabricated SOC 2 / ISO 27001
 * badges. The eyebrow + heading pair rides above the grid inside
 * a full-width band, matching the homepage section header recipe.
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
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border md:divide-y divide-border">
          {TRUST_BADGES.map((badge, index) => (
            <li
              key={badge.label}
              className={cn(
                "flex flex-col gap-1 p-5 lg:p-6 transition-colors hover:bg-accent/40",
                index < TRUST_BADGES.length - 1 &&
                  "md:border-r md:border-border",
              )}
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
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
