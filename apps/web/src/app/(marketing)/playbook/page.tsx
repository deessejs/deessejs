import type { Metadata } from "next"

import { Playbook } from "@/components/pages/playbook"

/**
 * Playbook lead-magnet landing page at `/playbook`.
 *
 * Draft status:
 *   This PR ships the page in **draft** state. The real PDF and
 *   the cover thumbnail are not in the repo yet — visible
 *   placeholders + the `apps/web/public/playbook/README.md` list
 *   the missing assets. The PR moves out of draft once the PDF
 *   link is tested live and the cover thumbnail is finalised.
 *
 * Layout:
 *   Hybrid, same recipe as /about and /pricing: each section
 *   component owns its own `border-b border-border` and padding;
 *   the page wrapper renders them in reading order.
 *
 * Authoritative copy lives in:
 *   - `components/pages/playbook/hero.tsx` — H1, lead, CTA
 *   - `components/pages/playbook/content/toc.ts` — chapter takeaways
 *     (used by `WhatYouGet` and `Preview`)
 *
 * Metadata pattern mirrors `apps/web/src/app/(marketing)/pricing/page.tsx`:
 * the page exports a `metadata` object with `title`, `description`,
 * `alternates.canonical`, `openGraph`, and `twitter` fields. The
 * canonical URL is relative (`/playbook`) and resolves against the
 * `metadataBase` set in the root `apps/web/src/app/layout.tsx`.
 *
 * Sitemap entry: `apps/web/src/app/sitemap.ts` adds `/playbook`
 * to the `staticPages` block.
 */
export const metadata: Metadata = {
  title: "Playbook — from AI-generated code to production software",
  description:
    "A working guide for developers who ship with coding agents. Free PDF download from DeesseJS.",
  alternates: {
    canonical: "/playbook",
  },
  openGraph: {
    title: "Playbook — from AI-generated code to production software",
    description:
      "A working guide for developers who ship with coding agents. Free PDF download from DeesseJS.",
    siteName: "DeesseJS",
    locale: "en_US",
    url: "/playbook",
  },
  twitter: {
    card: "summary_large_image",
    title: "Playbook — from AI-generated code to production software",
    description:
      "A working guide for developers who ship with coding agents. Free PDF download from DeesseJS.",
  },
  // The PDF and the cover image are placeholders for now. Until
  // they land, no `openGraph.images` entry is set — the global
  // OG fallback in `apps/web/src/app/layout.tsx` carries the page.
  robots: {
    index: true,
    follow: true,
  },
}

export default function PlaybookPage() {
  return (
    <>
      <Playbook.Hero />
      <Playbook.Problem />
      <Playbook.WhatYouGet />
      <Playbook.Preview />
      <Playbook.WhoItsFor />
      <Playbook.FinalCta />
    </>
  )
}
