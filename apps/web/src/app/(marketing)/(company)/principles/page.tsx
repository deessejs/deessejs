import type { Metadata } from "next"

import { RelatedLinks } from "@/components/pages/_shared/related-links"
import { Principles } from "@/components/pages/principles"

export const metadata: Metadata = {
  title: "Principles",
  description:
    "How the DeesseJS team works: operating tenets that guide day-to-day decisions on the project.",
}

/**
 * Principles at /principles.
 *
 * Grid of operating principles — the day-to-day rules the team
 * follows, complementing the more philosophical /manifesto. A
 * visitor who reads both should leave with both the *why* and the
 * *how*.
 *
 * The `<Separator />` between sections was replaced by
 * `border-b border-border` on each section's wrapper div — same
 * rhythm as every other marketing page.
 */
export default function PrinciplesPage() {
  return (
    <>
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-16">
        <div className="border-b border-border pb-16 md:pb-20 lg:pb-24">
          <Principles.Hero />
        </div>

        <div className="border-b border-border py-16 md:py-20 lg:py-24">
          <Principles.NineTenets />
        </div>

        <RelatedLinks
          links={[
            {
              label: "Manifesto",
              href: "/manifesto",
              body: "Why we're here: the beliefs behind the work.",
            },
            {
              label: "Vision",
              href: "/vision",
              body: "Where this is going next.",
            },
            {
              label: "About",
              href: "/about",
              body: "Who we are, and how we got here.",
            },
            {
              label: "Ecosystem",
              href: "/ecosystem",
              body: "The sub-domains and shared values.",
            },
          ]}
        />
      </div>

      <Principles.FinalCta />
    </>
  )
}
