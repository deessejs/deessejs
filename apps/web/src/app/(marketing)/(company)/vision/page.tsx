import type { Metadata } from "next"

import { RelatedLinks } from "@/components/pages/_shared/related-links"
import { Vision } from "@/components/pages/vision"

export const metadata: Metadata = {
  title: "Vision",
  description:
    "Where DeesseJS is heading: the next year of templates, contracts, and agent-aware tooling.",
}

/**
 * Vision at /vision.
 *
 * Long-form page that complements /manifesto (why) and
 * /principles (how) with **where we're going**. Three horizons:
 *   - Now (already shipping)
 *   - Next (in flight, expect this quarter)
 *   - Beyond (aspirational, no dates)
 *
 * The `<Separator />` between sections was replaced by
 * `border-b border-border` on each section's wrapper div — same
 * rhythm as every other marketing page.
 */
export default function VisionPage() {
  return (
    <>
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-16">
        <div className="border-b border-border pb-16 md:pb-20 lg:pb-24">
          <Vision.Hero />
        </div>

        <div className="border-b border-border py-16 md:py-20 lg:py-24">
          <Vision.Horizons />
        </div>

        <RelatedLinks
          links={[
            {
              label: "Manifesto",
              href: "/manifesto",
              body: "Why we're here: the beliefs behind the work.",
            },
            {
              label: "Principles",
              href: "/principles",
              body: "How we work, day to day.",
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

      <Vision.FinalCta />
    </>
  )
}
