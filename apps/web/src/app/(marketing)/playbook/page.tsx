import type { Metadata } from "next"

import { Playbook } from "@/components/pages/playbook"

/**
 * Playbook lead-magnet landing page at `/playbook`.
 *
 * Draft status:
 *   This PR ships the page in **draft** state. The real PDF is not
 *   in the repo yet, so the email the form triggers would deliver a
 *   404. `apps/web/public/playbook/README.md` tracks the missing
 *   asset. The PR moves out of draft once the PDF link is tested
 *   live.
 *
 * Layout:
 *   Five sections, full-bleed like every other marketing page:
 *   the two-column hero carrying the H1, the lead, the signup form,
 *   and the cover; the rotating tech-stack logo wall; the three
 *   most recent blog posts; a FAQ accordion in the enterprise
 *   2-col layout; then the shared Final CTA. The Problem,
 *   WhatYouGet, and WhoItsFor sections were removed; see the page
 *   README for what was removed and how to bring it back.
 *
 * Authoritative copy lives in
 * `components/pages/playbook/hero.tsx`: H1, lead, and the cover.
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
  title: "Playbook: from AI-generated code to production software",
  description:
    "A working guide for developers who ship with coding agents. Free PDF download from DeesseJS.",
  alternates: {
    canonical: "/playbook",
  },
  openGraph: {
    title: "Playbook: from AI-generated code to production software",
    description:
      "A working guide for developers who ship with coding agents. Free PDF download from DeesseJS.",
    siteName: "DeesseJS",
    locale: "en_US",
    url: "/playbook",
  },
  twitter: {
    card: "summary_large_image",
    title: "Playbook: from AI-generated code to production software",
    description:
      "A working guide for developers who ship with coding agents. Free PDF download from DeesseJS.",
  },
  // No `openGraph.images` entry yet. The cover mockup has landed,
  // but the page stays draft until the PDF does, and the global
  // OG fallback in `apps/web/src/app/layout.tsx` carries it until
  // then. Revisit when the PR moves out of draft.
  robots: {
    index: true,
    follow: true,
  },
}

export default function PlaybookPage() {
  return (
    <>
      <Playbook.Hero />
      <Playbook.TechStack />
      <Playbook.Reading />
      <Playbook.FAQ />
      <Playbook.FinalCta />
    </>
  )
}
