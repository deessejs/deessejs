import type { Metadata } from "next"

import { RelatedLinks } from "@/components/pages/_shared/related-links"
import { About } from "@/components/pages/about"

export const metadata: Metadata = {
  title: "About",
  description:
    "What DeesseJS is, who edits it, and how to get in touch.",
}

/**
 * About page at /about.
 *
 * Three-section narrative, matching the shape of /manifesto,
 * /principles, /vision, /ecosystem:
 *   1. The main app — what DeesseJS is for the org
 *   2. Edited by Nesalia Inc. — the open model
 *   3. Get in touch — channels
 *
 * Each section lives in `components/pages/about/<section>.tsx`;
 * data (channels) lives in `lib/about/channels.ts`. The route file
 * is just a table of contents.
 *
 * The `<Separator />` between sections was replaced by
 * `border-b border-border` on each section's wrapper div. This
 * matches the rhythm of every other marketing page (enterprise,
 * delivery, pricing, homepage all use border-b border-border). The
 * separator line was floating just below the hero H1 with no top
 * edge above it, which made the line "marry itself to the
 * headline" — the user complaint that drove this refactor.
 *
 * Note: commit 2 (next commit) will move the closing border onto
 * the hero wrapper itself; until then, the wrappers carry it.
 */
export default function AboutPage() {
  return (
    <>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-16">
        <div className="border-b border-border pb-16 md:pb-20 lg:pb-24">
          <About.Hero />
        </div>

        <div className="border-b border-border py-16 md:py-20 lg:py-24">
          <About.MainApp />
          <About.Editor />
        </div>

        <div className="border-b border-border py-16 md:py-20 lg:py-24">
          <About.Contact />
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
              label: "Vision",
              href: "/vision",
              body: "Where this is going next.",
            },
            {
              label: "Ecosystem",
              href: "/ecosystem",
              body: "The sub-domains and shared values.",
            },
          ]}
        />
      </div>

      <About.FinalCta />
    </>
  )
}
