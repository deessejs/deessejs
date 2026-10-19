import { Section } from "@/components/marketing/section"
import { SectionHeader } from "@/components/marketing/section-header"
import { Card } from "@workspace/ui/components/card"

import { PLAYBOOK_TOC } from "./content/toc"

/**
 * /playbook "What you'll find" section.
 *
 * Six-chapter card grid. Mirrors the shared-border pattern used
 * across the marketing surface (`/`, `/principles`, `/enterprise`):
 * `<Section>` wrapper provides the bottom divider, `<SectionHeader>`
 * renders the eyebrow + title + subtitle, then a 1/2/3-column
 * grid of `<Card>`s.
 *
 * Each card carries the chapter number (mono label so the eye
 * anchors on the count first) and the takeaway (verb-first
 * outcome). `bordered={false}` on the header avoids a double
 * border. The parent `<Section>` already provides one.
 *
 * The TOC is the same source of truth that the deleted Preview
 * section used (`./content/toc.ts`), so the page-local grid
 * remains the single visible instance of the chapter list.
 */
export function WhatYouGet() {
  return (
    <Section>
      <SectionHeader
        eyebrow="What's inside"
        title="Six chapters from prompt to production"
        subtitle="Each chapter opens with a moment you'd recognise and closes with what to do about it."
        bordered={false}
      />
      <ol className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 md:p-8 lg:grid-cols-3 lg:p-10 [&:not(:first-child)]:mt-0">
        {PLAYBOOK_TOC.map((entry) => (
          <li key={entry.id} className="list-none">
            <Card className="flex h-full flex-col p-6">
              <span className="text-label-13 font-mono text-muted-foreground">
                {entry.id}
              </span>
              <p className="text-copy-16 text-foreground leading-7">
                {entry.takeaway}
              </p>
            </Card>
          </li>
        ))}
      </ol>
    </Section>
  )
}
