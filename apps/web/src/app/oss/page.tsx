import type { Metadata } from "next"
import { H1, P } from "@workspace/ui/components/typography"

export const metadata: Metadata = {
  title: "Open Source Program",
  robots: { index: false, follow: false },
}

export default function OssPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <H1>Open Source Program</H1>
      <P>
        Information about DeesseJS&apos;s open source program — sponsorship
        tiers, supported projects, and how to apply. This page is a
        placeholder — replace it with the program details before going
        to production.
      </P>
    </div>
  )
}
