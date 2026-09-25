import Link from "next/link"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { TierCardPricing } from "@/app/(marketing)/_components/tier-card-pricing"
import { TierTagline } from "@/app/(marketing)/_components/tier-tagline"
import type { LicenseType } from "@/lib/pricing"

import { Cell } from "./_shared/cell"
import { LICENSE_KICKER } from "./license-kicker"
import { PriceBlock } from "./price-block"

/**
 * License card — kicker + name + tagline + price + bullets + CTA.
 *
 * The `recommended` flag triggers the elevated visual treatment
 * (negative margin + shadow + ring) used for the Pro tier.
 */
export function LicenseCell({
  license,
  isLast = false,
}: {
  license: LicenseType
  isLast?: boolean
}) {
  const isRecommended = license.recommended === true
  return (
    <div
      className={cn(
        "group relative border-border transition-colors hover:bg-accent/40",
        // Vertical separators on md+: every cell gets a right border
        // except the last one. This replaces the grid's divide-x so
        // Pro's ring doesn't double up on the divider.
        "border-b last:border-b-0 md:border-b-0 md:border-r",
        isLast && "md:border-r-0",
        isRecommended &&
          "bg-background md:-my-px md:border md:border-border md:shadow-[0_8px_24px_-12px_rgb(0_0_0_/0.15)]",
      )}
    >
      <Cell className="gap-5 h-full">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-label-13 text-muted-foreground">
              {LICENSE_KICKER[license.id]}
            </span>
            {isRecommended ? (
              <Badge variant="success" className="text-label-12 gap-1.5">
                <span
                  aria-hidden
                  className="size-1.5 rounded-full bg-emerald-500"
                />
                Recommended
              </Badge>
            ) : null}
          </div>
          <h3 className="text-heading-24 tracking-tight text-foreground !m-0">
            {license.name}
          </h3>
          <p className="text-copy-14 text-muted-foreground [&:not(:first-child)]:mt-0">
            {license.id === "professional" ||
            license.id === "agency" ? (
              <TierTagline tier={license.id === "professional" ? "professional" : "agency"} />
            ) : (
              license.tagline
            )}
          </p>
        </header>

        {isRecommended ||
        (license.id === "agency") ? (
          <TierCardPricing license={license} />
        ) : (
          <>
            <PriceBlock price={license.price} />

            <p className="text-copy-14 text-foreground/90 [&:not(:first-child)]:mt-0">
              {license.forWho}
            </p>

            <p className="text-copy-14 text-foreground/90 [&:not(:first-child)]:mt-0">
              {license.positioning}
            </p>

            <ul className="flex flex-col gap-2 text-copy-14 text-muted-foreground">
              {license.ships.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden="true" className="select-none">
                    •
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-2">
              {license.cta.external ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full"
                >
                  <a href={license.cta.href}>{license.cta.label}</a>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full"
                >
                  <Link href={license.cta.href}>{license.cta.label}</Link>
                </Button>
              )}
            </div>
          </>
        )}
      </Cell>
    </div>
  )
}
