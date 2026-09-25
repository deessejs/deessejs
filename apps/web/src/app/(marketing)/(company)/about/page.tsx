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
 * Routes each section directly at the root — no `max-w-5xl
 * mx-auto` wrapper, no shared `<Separator />` between blocks.
 * Each section component owns its own border-b and padding,
 * matching the rhythm of the marketing app's enterprise /
 * delivery / pricing pages (`apps/web/src/app/(marketing)/pricing/
 * page.tsx:13-34`, `delivery/page.tsx:13-25`,
 * `enterprise/page.tsx:13-26`).
 *
 * The 3 sections are:
 *   - Hero (eyebrow + h1 + lead)
 *   - MainApp + Editor (full-width border-b blocks; 2-col grid
 *     on lg+ inside each)
 *   - Contact (1×3 channel card grid; 2-col title/content on lg+)
 *
 * The "Read next" <RelatedLinks> and "Browse templates" CTA
 * block sit at the bottom, full-width — same architecture as
 * the rest of the Company pages.
 */
export default function AboutPage() {
  return (
    <>
      <About.Hero />

      <About.MainApp />
      <About.Editor />

      <About.Contact />

      <div className="border-t border-border px-4 md:px-6 py-16 md:py-20 lg:py-24">
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
