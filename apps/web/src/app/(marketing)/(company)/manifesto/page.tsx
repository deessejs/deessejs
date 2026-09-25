import Link from "next/link"
import type { Metadata } from "next"

import { Button } from "@workspace/ui/components/button"

import { TableOfContents } from "@/components/blog/table-of-contents"
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
 * Long-form page that doubles as a brand explainer: a visitor
 * who lands here should walk away understanding what DeesseJS
 * believes and how that shapes the tools we ship.
 *
 * 2-col layout on lg+: scrollable prose body on the left,
 * sticky <TableOfContents> on the right. The TOC targets
 * the body block (`id="manifesto-body"`) and skips the
 * RelatedLinks below — only the six belief H2s are navigation
 * targets. Same pattern as
 * `apps/web/src/app/(content)/blog/[slug]/page.tsx`.
 *
 * Each section (hero, intro+beliefs block, RelatedLinks
 * block) carries its own `border-b border-border` for the
 * shared-border rhythm established on the enterprise /
 * delivery / pricing / homepage pages.
 */
export default function ManifestoPage() {
  return (
    <>
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-16">
        <div className="border-b border-border pb-16 md:pb-20 lg:pb-24">
          <Manifesto.Hero />
        </div>

        <div className="grid grid-cols-1 gap-12 border-b border-border py-16 md:py-20 lg:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
          <div id="manifesto-body" className="max-w-3xl space-y-12">
            <Manifesto.Intro />
            <Manifesto.Beliefs />
            <div className="flex justify-center pt-2">
              <Button variant="outline" asChild size="lg">
                <Link href="/templates">Browse templates</Link>
              </Button>
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <TableOfContents targetId="manifesto-body" />
            </div>
          </aside>
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
