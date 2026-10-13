"use client"

import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

import type { LicenseType } from "@/lib/pricing"

import { PriceBlock } from "@/components/pages/pricing/price-block"
import { usePricingCadence } from "./pricing-cadence-context"

/**
 * Cadence-aware price + CTA block for the Pro and Agency tier cards.
 *
 * Reads the shared cadence from the hero tabs and renders the
 * matching price via `PriceBlock` (which knows how to render both
 * cadences from the single `PlanPricing` configuration in
 * `lib/pricing.ts`). The rest of the card copy (forWho / positioning
 * / ships) is unchanged across cadences because the catalog is the
 * same — only the payment cadence changes.
 *
 * The CTA href carries the cadence as a query string so the billing
 * portal (or whatever stands in until Stripe is wired) lands on the
 * right plan. The CTA label is the static `license.cta.label` —
 * the copy does not flip on cadence; the price block does.
 *
 * Tiers without a subscription price (Community, Enterprise) bypass
 * this component at the call-site.
 */
export function TierCardPricing({ license }: { license: LicenseType }) {
  const { cadence } = usePricingCadence()
  const href = `${license.cta.href}?cadence=${cadence}`

  return (
    <>
      <PriceBlock price={license.price} cadence={cadence} />

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
        <Button asChild size="lg" className="w-full">
          <Link href={href}>{license.cta.label}</Link>
        </Button>
      </div>
    </>
  )
}
