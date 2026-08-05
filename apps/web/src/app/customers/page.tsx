import type { Metadata } from "next"
import { H1, P } from "@workspace/ui/components/typography"

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
}

export default function CustomersPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <H1>Customers</H1>
      <P>
        Customer stories and case studies for DeesseJS. This page is a
        placeholder — replace it with the customer showcase content
        before going to production.
      </P>
    </div>
  )
}
