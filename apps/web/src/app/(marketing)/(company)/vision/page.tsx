import type { Metadata } from "next"

import { TableOfContents } from "@/components/blog/table-of-contents"
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
 * 2-col layout on lg+: scrollable horizons stack on the left,
 * sticky <TableOfContents> on the right. The TOC targets the
 * horizons block (`id="vision-body"`) and discovers both the 3
 * horizon H2s ("Now" / "Next" / "Beyond") and the 12 item
 * H3s — same scroll-spy pattern as the blog long-form
 * template.
 */
export default function VisionPage() {
  return (
    <>
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-16">
        <div className="border-b border-border pb-16 md:pb-20 lg:pb-24">
          <Vision.Hero />
        </div>

        <div className="grid grid-cols-1 gap-12 border-b border-border py-16 md:py-20 lg:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
          <div id="vision-body" className="max-w-3xl space-y-12">
            <Vision.Horizons />
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <TableOfContents targetId="vision-body" />
            </div>
          </aside>
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
