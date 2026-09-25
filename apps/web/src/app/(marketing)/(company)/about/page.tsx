import type { Metadata } from "next"

import { Separator } from "@workspace/ui/components/separator"

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
 */
export default function AboutPage() {
  return (
    <>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-16">
        <About.Hero />

        <Separator />

        <About.MainApp />
        <About.Editor />

        <Separator />

        <About.Contact />

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
