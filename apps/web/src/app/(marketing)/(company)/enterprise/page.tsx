import type { Metadata } from "next"

import { Enterprise } from "@/components/pages/enterprise"

export const metadata: Metadata = {
  title: "Enterprise",
  description:
    "Custom Pro engagements for larger teams. Multi-template bundles, dedicated support, procurement-ready invoicing.",
  robots: { index: false, follow: false },
}

export default function EnterprisePage() {
  return (
    <>
      <Enterprise.JsonLd />
      <Enterprise.Hero />
      <Enterprise.Trust />
      <Enterprise.Personas />
      <Enterprise.ProofPoints />
      <Enterprise.Process />
      <Enterprise.Inquiry />
      <Enterprise.FAQ />
      <Enterprise.FinalCta />
    </>
  )
}
