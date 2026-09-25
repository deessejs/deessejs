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
 * Hybrid layout:
 * - The Hero is centered full-width via its own wrapper
 *   (centered text on mobile, left-aligned on lg+, max-w-2xl
 *   lead). The hero carries its own `border-b border-border`.
 * - The three body sections (MainApp, Editor, Contact) and
 *   the "Read next" RelatedLinks block all sit inside a
 *   single `max-w-5xl` column, centered on the page. Each
 *   section component owns its own `border-b border-border`
 *   and padding.
 * - The FinalCta breaks out of the column and traces the full
 *   viewport with its `border-t border-border` (the same
 *   `noBorderB` boolean removes its closing border-b).
 *
 * This hybrid layout keeps the hero full-width (which matches
 * `/delivery`, `/enterprise`, `/pricing`) and the body boxed
 * at 1024px (which is the user's preferred reading width).
 */
export default function AboutPage() {
  return (
    <>
      <About.Hero />

      <div className="mx-auto max-w-5xl">
        <About.MainApp />
        <About.Editor />

        <About.Contact />

        <div className="py-16 md:py-20 lg:py-24">
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
      </div>

      <About.FinalCta />
    </>
  )
}
