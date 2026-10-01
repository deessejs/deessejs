import type { Metadata } from "next"

import { RelatedLinks } from "@/components/pages/_shared/related-links"
import { Help } from "@/components/pages/help"

export const metadata: Metadata = {
  title: "Help",
  description:
    "How to get help with DeesseJS. Self-serve first, ask later.",
}

/**
 * Help page at /help.
 *
 * Self-serve first, ask later. Most questions are answered in the
 * Knowledge Base or the Docs. For everything else, the team is
 * reachable through the channels below.
 *
 * The `<Separator />` between sections was replaced by
 * `border-b border-border` on each section's wrapper div — same
 * rhythm as every other marketing page (enterprise, delivery,
 * pricing, homepage).
 *
 * Note: commit 2 will move the closing border onto the hero
 * wrapper itself.
 */
export default function HelpPage() {
  return (
    <>
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-16">
        <div className="border-b border-border pb-16 md:pb-20 lg:pb-24">
          <Help.Hero />
        </div>

        <div className="border-b border-border py-16 md:py-20 lg:py-24">
          <Help.SelfServe />
        </div>

        <div className="border-b border-border py-16 md:py-20 lg:py-24">
          <Help.Community />
        </div>

        <div className="border-b border-border py-16 md:py-20 lg:py-24">
          <Help.Email />
        </div>

        <div className="border-b border-border py-16 md:py-20 lg:py-24">
          <Help.ResponseTimes />
        </div>

        <RelatedLinks
          links={[
            {
              label: "About",
              href: "/about",
              body: "Who edits the project, and how to reach us.",
            },
            {
              label: "Manifesto",
              href: "/manifesto",
              body: "The beliefs behind the work.",
            },
            {
              label: "Knowledge Base",
              href: "/knowledge-base",
              body: "How-tos and reference material for common tasks.",
            },
            {
              label: "Documentation",
              href: "https://docs.deessejs.com",
              body: "The full API and configuration reference.",
              external: true,
            },
          ]}
        />
      </div>

      <Help.FinalCta />
    </>
  )
}
