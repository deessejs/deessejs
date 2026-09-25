"use client"

import { usePricingCadence } from "./pricing-cadence-context"

/**
 * Cadence-aware tagline for the Pro and Agency tier cards.
 *
 * The static `LICENSE_TYPES[i].tagline` is identical for both
 * cadences (e.g. "One-time payment · Lifetime access"), but the
 * visitor's mental model flips when the cadence toggle is set to
 * "subscription": the subscription price ($23/mo for Pro, $79/mo for
 * Agency) doesn't match "one-time payment" copy.
 *
 * This component reads the shared cadence and renders the matching
 * tagline. For other tiers (Community, Enterprise) the static tagline
 * is fine and this component is bypassed at the call-site.
 */
export function TierTagline({ tier }: { tier: "professional" | "agency" }) {
  const { cadence } = usePricingCadence()
  const isSubscription = cadence === "subscription"

  if (isSubscription) {
    return tier === "professional"
      ? "Monthly cadence · Cancel any time"
      : "Monthly cadence · 5 seats · Cancel any time"
  }

  return tier === "professional"
    ? "One-time payment · Lifetime access"
    : "One-time payment · 5 seats included"
}
