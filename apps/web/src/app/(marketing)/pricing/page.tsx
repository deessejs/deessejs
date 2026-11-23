import type { Metadata } from "next"

import { clientEnv } from "@workspace/env/client"
import { Pricing } from "@/components/pages/pricing"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Community stays free. Pro is one subscription priced by developer seat, with the same features and commercial-use rights on every seat.",
}

export default function PricingPage() {
  // Resolve the apps/app organization billing URL server-side so the CTA
  // is a fully-formed absolute URL by the time it reaches the browser.
  // Same convention as the site header's cross-app links: env
  // defaults to `http://localhost:3001/signup` in dev and
  // `https://app.deessejs.com/signup` in prod; previews can be
  // overridden via Vercel-related-projects wiring.
  const signupHref = new URL(
    "/organizations?intent=pro",
    clientEnv.NEXT_PUBLIC_APP_URL
  ).toString()

  return (
    <>
      <Pricing.JsonLd />
      <Pricing.Hero />
      <Pricing.LicenseTypes proHref={signupHref} />
      <Pricing.TechStack />
      <Pricing.Comparison />
      <Pricing.Personas />
      <Pricing.EnterpriseReady />
      <Pricing.FAQ />
      <Pricing.FinalCta signupHref={signupHref} />
    </>
  )
}
