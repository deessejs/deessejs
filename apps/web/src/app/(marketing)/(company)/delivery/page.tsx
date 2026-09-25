import type { Metadata } from "next"

import { Delivery } from "@/components/pages/delivery"

export const metadata: Metadata = {
  title: "Delivery",
  description:
    "Engineering services by the team that built DeesseJS. Production-ready scaffolding, custom builds, embedded engineering.",
  robots: { index: false, follow: false },
}

export default function DeliveryPage() {
  return (
    <>
      <Delivery.JsonLd />
      <Delivery.Hero />
      <Delivery.Comparison />
      <Delivery.EngagementModels />
      <Delivery.Process />
      <Delivery.ProofOfEngineering />
      <Delivery.Intake />
      <Delivery.FAQ />
      <Delivery.FinalCta />
    </>
  )
}
