import type { Metadata } from "next"

import { Separator } from "@workspace/ui/components/separator"

import { RelatedLinks } from "@/components/pages/_shared/related-links"
import { Help } from "@/components/pages/help"

export const metadata: Metadata = {
  title: "Help",
  description:
    "How to get help with DeesseJS. Self-serve first, ask later.",
}

export default function HelpPage() {
  return (
    <>
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-16">
        <Help.Hero />
        <Separator />
        <Help.SelfServe />
        <Separator />
        <Help.Community />
        <Separator />
        <Help.Email />
        <Separator />
        <Help.ResponseTimes />
        <Separator />
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
