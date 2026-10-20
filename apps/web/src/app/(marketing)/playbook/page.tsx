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
    "A practical playbook for building maintainable software with coding agents. Free PDF download from DeesseJS.",
  alternates: {
    canonical: "/playbook",
  },
  openGraph: {
    title: "Playbook: from AI-generated code to production software",
    description:
      "A practical playbook for building maintainable software with coding agents. Free PDF download from DeesseJS.",
    siteName: "DeesseJS",
    locale: "en_US",
    url: "/playbook",
  },
  twitter: {
    card: "summary_large_image",
    title: "Playbook: from AI-generated code to production software",
    description:
      "A practical playbook for building maintainable software with coding agents. Free PDF download from DeesseJS.",
  },
  // No `openGraph.images` entry. The cover mockup is the only image
  // the page has, and it is a poor social card: 1500x1383 on a
  // transparent background, while a social card is cropped to about
  // 1.91:1, which would slice through the book. No other page in the
  // repo sets one either, and the global fallback in
  // `apps/web/src/app/layout.tsx` has none, so this is a repo-wide
  // gap rather than a playbook one. Composing a 1200x630 card is a
  // separate piece of design work.
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
