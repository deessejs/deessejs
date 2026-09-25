import Link from "next/link"
import type { Metadata } from "next"

import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"

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
 * lives in `lib/manifesto/beliefs.ts`. The closing "Browse
 * templates" button row is page-specific and stays inline here
 * because /templates is its only consumer.
 *
 * The <Manifesto.FinalCta /> is rendered as a sibling of the
 * max-w-5xl wrapper so the shared shell's border-t/border-b
 * trace the full page-edge.
 */
export default function ManifestoPage() {
  return (
    <>
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-16">
        <Manifesto.Hero />

        <Separator />

        <Manifesto.Intro />

        <Separator />

        <Manifesto.Beliefs />

        <Separator />

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
        <div className="flex justify-center pt-2">
          <Button variant="outline" asChild size="lg">
            <Link href="/templates">Browse templates</Link>
          </Button>
        </div>
      </div>

      <Manifesto.FinalCta />
    </>
  )
}
