"use client"

import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

import type { LicenseType } from "@/lib/pricing"

import { usePricingCadence } from "./pricing-cadence-context"

/**
 * Client-only block for the Pro tier card. Reads the shared cadence
 * from the hero tabs and renders the matching price + CTA. The rest
 * of the card copy (forWho / positioning / ships) is unchanged
 * across cadences because the Pro catalog is the same.
 */
export function ProCardPricing({ license }: { license: LicenseType }) {
  const { cadence } = usePricingCadence()
  const isSubscription = cadence === "subscription"
  const href = isSubscription
    ? `${license.cta.href}?cadence=monthly`
    : license.cta.href
  const ctaLabel = isSubscription ? "Subscribe" : license.cta.label

  return (
    <>
      {isSubscription ? (
        <p className="text-heading-32 tracking-tight text-foreground">
          $23
          <span className="text-copy-14 ml-2 font-normal text-muted-foreground">
            / month, cancel any time
          </span>
        </p>
      ) : (
        <p className="text-heading-32 tracking-tight text-foreground">
          $299
          <span className="text-copy-14 ml-2 font-normal text-muted-foreground">
            one-shot, lifetime
          </span>
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
