import type { Metadata } from "next"

import { Separator } from "@workspace/ui/components/separator"

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
 * The route file is just a table of contents — sections live in
 * `components/pages/vision/<section>.tsx` and the horizons data
 * lives in `lib/vision/horizons.ts`.
 *
 * <Vision.FinalCta /> is rendered as a sibling of the max-w-5xl
 * wrapper so the shell's border-t/border-b trace the full page-edge.
 */
export default function VisionPage() {
  return (
    <>
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-16">
        <Vision.Hero />

        <Separator />

        <Vision.Horizons />

        <Separator />

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
