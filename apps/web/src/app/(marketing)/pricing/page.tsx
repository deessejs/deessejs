import type { Metadata } from "next"

import { PricingCadenceProvider } from "../_components/pricing-cadence-context"
import { Pricing } from "@/components/pages/pricing"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "How DeesseJS licensing works: per-project one-shot licenses, optional subscription for ongoing updates, MIT for the open community, and custom engagements for enterprise teams.",
}

export default function PricingPage() {
  return (
    <PricingCadenceProvider>
      <Pricing.JsonLd />
      <Pricing.Hero />
      <Pricing.CadenceTabs />
      <Pricing.LicenseTypes />
      <Pricing.TechStack />
      <Pricing.Comparison />
      <Pricing.Personas />
      <Pricing.EnterpriseReady />
      <Pricing.FAQ />
      <Pricing.FinalCta />
    </PricingCadenceProvider>
  )
}
