"use client"

import { usePricingCadence } from "./pricing-cadence-context"

/**
 * Cadence-aware tagline for the Pro and Agency tier cards.
 *
 * The static `LICENSE_TYPES[i].tagline` already covers the cadence in
 * its first clause ("Monthly or annual · ..."), so this component
 * only needs to add the seat-count line for Agency and the
 * "cancel any time" reassurance for monthly. We do not duplicate the
 * cadence label itself (the static tagline already says "Monthly or
 * annual").
 */
export function TierTagline({ tier }: { tier: "professional" | "agency" }) {
  const { cadence } = usePricingCadence()

  if (cadence === "monthly") {
    return tier === "professional"
      ? "Cancel any time"
      : "5 seats · Cancel any time"
  }

  return tier === "professional"
    ? "Save two months vs monthly"
    : "5 seats · Save two months vs monthly"
}
