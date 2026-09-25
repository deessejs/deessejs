import type { Metadata } from "next"

import { PricingCadenceProvider } from "../_components/pricing-cadence-context"
import { clientEnv } from "@workspace/env/client"
import { Pricing } from "@/components/pages/pricing"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "How DeesseJS licensing works: per-project one-shot licenses, optional subscription for ongoing updates, MIT for the open community, and custom engagements for enterprise teams.",
}

export default function PricingPage() {
  // Resolve the apps/app signup URL server-side so the Final CTA link
  // is a fully-formed absolute URL by the time it reaches the browser.
  // Same convention as the site header's cross-app links (ADR-029):
  // env defaults to `http://localhost:3001/signup` in dev and
  // `https://app.deessejs.com/signup` in prod; previews can be
  // overridden via Vercel-related-projects wiring.
  const signupHref = new URL("/signup", clientEnv.NEXT_PUBLIC_APP_URL).toString()

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
