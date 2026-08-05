import type { Metadata } from "next"
import { H1, P } from "@workspace/ui/components/typography"

export const metadata: Metadata = {
  title: "Legal Notice",
  robots: { index: false, follow: false },
}

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <H1>Legal Notice</H1>
      <P>
        Publisher information, contact details, and hosting provider go
        here. This page is a placeholder — replace it with the legal
        notice required by your jurisdiction before going to production.
      </P>
    </div>
  )
}
