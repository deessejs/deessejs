import { PricingHeroTabs } from "@/app/(marketing)/_components/pricing-hero-tabs"

/**
 * Cadence toggle — 16px tall strip flush against the license cards
 * below. The tabs (lifetime vs subscription) live here rather than in
 * the hero so they read as the lever that drives the cards beneath.
 *
 * The cadence context (`PricingCadenceProvider`) is supplied higher up
 * in `pricing/page.tsx` so this component stays presentational.
 */
export function CadenceTabs() {
  return (
    <div className="flex h-12 items-center justify-center border-b border-border">
      <PricingHeroTabs />
    </div>
  )
}
