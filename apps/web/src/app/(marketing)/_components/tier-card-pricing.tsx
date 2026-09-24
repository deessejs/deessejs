"use client"

import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

import type { LicenseType, LicenseTypeId } from "@/lib/pricing"

import { usePricingCadence } from "./pricing-cadence-context"

/**
 * Subscription price per tier, used when the cadence is flipped to
 * `subscription`. Tiers without a subscription (open-community,
 * enterprise) keep their one-shot / custom pricing regardless of the
 * cadence state and bypass this component.
 */
const SUBSCRIPTION_PRICE: Partial<Record<LicenseTypeId, number>> = {
  subscription: 23,
  agency: 79,
}

/**
 * Cadence-aware price + CTA block for the Pro and Agency tier cards.
 *
 * Reads the shared cadence from the hero tabs and renders the
 * matching price (e.g. `$299 one-shot` vs `$23 / month` for Pro,
 * `$799 one-shot` vs `$79 / month` for Agency). The rest of the
 * card copy (forWho / positioning / ships) is unchanged across
 * cadences because the catalog is the same — only the payment
 * cadence changes.
 *
 * Replaces the previous `ProCardPricing` (Pro-only). Agency uses the
 * same toggle and the same component.
 */
export function TierCardPricing({ license }: { license: LicenseType }) {
  const { cadence } = usePricingCadence()
  const isSubscription = cadence === "subscription"
  const monthlyPrice = SUBSCRIPTION_PRICE[license.id]
  const href = isSubscription
    ? `${license.cta.href}?cadence=monthly`
    : license.cta.href
  const ctaLabel = isSubscription ? "Subscribe" : license.cta.label

  return (
    <>
      {isSubscription && monthlyPrice !== undefined ? (
        <p className="text-heading-32 tracking-tight text-foreground">
          ${monthlyPrice}
          <span className="text-copy-14 ml-2 font-normal text-muted-foreground">
            / month, cancel any time
          </span>
        </p>
      ) : license.price.kind === "fixed" ? (
        <p className="text-heading-32 tracking-tight text-foreground">
          ${license.price.amount}
          <span className="text-copy-14 ml-2 font-normal text-muted-foreground">
            one-shot, lifetime
          </span>
        </p>
      ) : (
        <p className="text-heading-32 tracking-tight text-foreground">
          Custom
        </p>
      )}

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
          <Link href={href}>{ctaLabel}</Link>
        </Button>
      </div>
    </>
  )
}
