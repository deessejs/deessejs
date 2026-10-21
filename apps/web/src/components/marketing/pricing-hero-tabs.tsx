"use client"

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import {
  usePricingCadence,
  type PricingCadence,
} from "./pricing-cadence-context"

/**
 * Client-only cadence toggle rendered in the hero. Reads and writes
 * the shared cadence so the Pro and Agency cards below stay in sync.
 *
 * The cadence is the only dimension the buyer controls on the
 * pricing page: monthly or annual, same catalog either way.
 */
export function PricingHeroTabs() {
  const { cadence, setCadence } = usePricingCadence()

  return (
    <Tabs
      value={cadence}
      onValueChange={(v) => setCadence(v as PricingCadence)}
      className="mt-1"
    >
      <TabsList variant="line" className="inline-flex">
        <TabsTrigger value="monthly">Monthly</TabsTrigger>
        <TabsTrigger value="annual">Annual</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
