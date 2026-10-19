import { Section } from "@/components/marketing/section"
import { SectionHeader } from "@/components/marketing/section-header"

import { PLAYBOOK_TOC } from "./content/toc"

/**
 * /playbook "What you'll find" section.
 *
 * Six-cell grid following the marketing shared-border recipe
 * (`<Section>` + `<SectionHeader>` + plain cells with dividers),
 * the same shape as the homepage's `ForWho` persona grid: no
 * Card primitive, no rounded corners, transparent background,
 * cells touching (no gap), separated only by `border-border`
 * dividers. The header carries `bordered={true}` so the reader
 * sees an explicit divider between the title block and the
 * chapter cells.
 *
 * Each cell carries the chapter number (mono label so the eye
 * anchors on the count first) and the takeaway (verb-first
 * outcome). On `md+` the 3-col layout means two rows of three;
 * the `nth-child(3n+1)` selector drops the left border on the
 * first cell of each row so the cells stitch cleanly with the
 * section's outer borders.
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
        bordered={true}
      />
      <ol className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-y-0">
        {PLAYBOOK_TOC.map((entry) => (
          <li
            key={entry.id}
            className="list-none md:border-l md:border-border md:[&:nth-child(3n+1)]:border-l-0 md:[&:nth-child(n+4)]:border-t md:border-t-border"
          >
            <div className="flex flex-col gap-3 p-6 md:p-8">
              <span className="text-label-13 font-mono text-muted-foreground">
                {entry.id}
              </span>
              <p className="text-copy-16 text-foreground leading-7">
                {entry.takeaway}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}
