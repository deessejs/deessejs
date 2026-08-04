import type { Metadata } from "next"
import { H1, P } from "@workspace/ui/components/typography"

export const metadata: Metadata = {
  title: "Help",
  robots: { index: false, follow: false },
}

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <H1>Help</H1>
      <P>
        Need a hand? This page is a placeholder — point users at the
        documentation, support email, or community channels before going
        to production.
      </P>
    </div>
  )
}
