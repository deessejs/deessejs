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
 * the shared cadence so the Pro card below stays in sync.
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
        <TabsTrigger value="lifetime">Lifetime</TabsTrigger>
        <TabsTrigger value="subscription">Subscription</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
