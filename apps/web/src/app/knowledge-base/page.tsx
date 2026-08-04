import type { Metadata } from "next"
import { H1, P } from "@workspace/ui/components/typography"

export const metadata: Metadata = {
  title: "Knowledge Base",
  robots: { index: false, follow: false },
}

export default function KnowledgeBasePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <H1>Knowledge Base</H1>
      <P>
        Articles, tutorials, and reference material for DeesseJS. This
        page is a placeholder — replace it with the actual knowledge
        base index before going to production.
      </P>
    </div>
  )
}
