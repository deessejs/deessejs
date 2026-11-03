import type { Metadata } from "next"

import { PricingCadenceProvider } from "@/components/marketing/pricing-cadence-context"
import { Pricing } from "@/components/pages/pricing"
import { appUrl } from "@/lib/preview-urls"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "How DeesseJS licensing works: monthly or annual subscriptions for every paid plan, MIT for the open community, and custom engagements for enterprise teams. Cancel any time; projects in production at the time of cancellation stay covered.",
}

export default function PricingPage() {
  // Resolve the apps/app signup URL server-side so the Final CTA link
  // is a fully-formed absolute URL by the time it reaches the browser.
  // Match the site header's Vercel related-project resolution so
  // preview CTAs target the matching app deployment.
  const signupHref = new URL("/signup", appUrl).toString()

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
      <Pricing.FinalCta signupHref={signupHref} />
    </PricingCadenceProvider>
  )
}
