import type { Metadata } from "next"
import { H1, P } from "@workspace/ui/components/typography"

export const metadata: Metadata = {
  title: "Enterprise",
  robots: { index: false, follow: false },
}

export default function EnterprisePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <H1>Enterprise</H1>
      <P>
        DeesseJS for enterprise — SLAs, security, compliance, and
        custom deployment options. This page is a placeholder — replace
        it with the program details before going to production.
      </P>
    </div>
  )
}
