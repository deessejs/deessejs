import type { Metadata } from "next"
import { H1, P } from "@workspace/ui/components/typography"

export const metadata: Metadata = {
  title: "Students",
  robots: { index: false, follow: false },
}

export default function StudentsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <H1>Students</H1>
      <P>
        DeesseJS for students — free credits, learning resources, and
        how to get a verified student account. This page is a placeholder
        — replace it with the program details before going to production.
      </P>
    </div>
  )
}
