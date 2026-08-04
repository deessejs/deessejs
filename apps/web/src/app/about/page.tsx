import type { Metadata } from "next"
import { H1, P } from "@workspace/ui/components/typography"

export const metadata: Metadata = {
  title: "About DeesseJS",
  robots: { index: false, follow: false },
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <H1>About DeesseJS</H1>
      <P>
        DeesseJS is the main app of the deessejs organization. This page
        is a placeholder — replace it with the team's story before going
        to production.
      </P>
    </div>
  )
}
