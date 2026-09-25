import Link from "next/link"
import type { Metadata } from "next"

import { Button } from "@workspace/ui/components/button"

import { RelatedLinks } from "@/components/pages/_shared/related-links"
import { Manifesto } from "@/components/pages/manifesto"

export const metadata: Metadata = {
  title: "Manifesto",
  description:
    "The beliefs that shape how DeesseJS builds software, ships templates, and thinks about the agentic era.",
}

/**
 * Manifesto at /manifesto.
 *
 * Long-form page that doubles as a brand explainer: a visitor who
 * lands here should walk away understanding what DeesseJS believes
 * and how that shapes the tools we ship.
 *
 * The route file is just a table of contents — sections live in
 * `components/pages/manifesto/<section>.tsx` and the beliefs data
 * lives in `lib/manifesto/beliefs.ts`. The "Browse templates"
 * button row is page-specific.
 *
 * The `<Separator />` between sections was replaced by
 * `border-b border-border` on each section's wrapper div — same
 * rhythm as every other marketing page.
 */
export default function ManifestoPage() {
  return (
    <>
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-16">
        <div className="border-b border-border pb-16 md:pb-20 lg:pb-24">
          <Manifesto.Hero />
        </div>

        <div className="border-b border-border py-16 md:py-20 lg:py-24">
          <Manifesto.Intro />
        </div>

        <div className="border-b border-border py-16 md:py-20 lg:py-24">
          <Manifesto.Beliefs />
          <div className="mt-12 flex justify-center">
            <Button variant="outline" asChild size="lg">
              <Link href="/templates">Browse templates</Link>
            </Button>
          </div>
        </div>

        <RelatedLinks
          links={[
            {
              label: "About",
              href: "/about",
              body: "Who we are, and how we got here.",
            },
            {
              label: "Principles",
              href: "/principles",
              body: "How we work, day to day.",
            },
            {
              label: "Vision",
              href: "/vision",
              body: "Where we're taking this next.",
            },
            {
              label: "Ecosystem",
              href: "/ecosystem",
              body: "The sub-domains and shared values.",
            },
          ]}
        />
      </div>

      <Manifesto.FinalCta />
    </>
  )
}
