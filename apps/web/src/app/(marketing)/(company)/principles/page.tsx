import type { Metadata } from "next"

import { Separator } from "@workspace/ui/components/separator"

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
 * The route file is just a table of contents — sections live in
 * `components/pages/principles/<section>.tsx` and the principles
 * data lives in `lib/principles/tenets.ts`.
 */
export default function PrinciplesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-16">
      <Principles.Hero />

      <Separator />

      <Principles.NineTenets />

      <Separator />

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
  )
}
