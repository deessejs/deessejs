import { Section } from "@/components/marketing/section"

import { PLAYBOOK_TOC } from "./content/toc"

/**
 * /playbook "What you'll find" section.
 *
 * Six-cell grid following the ForWho pattern from the homepage:
 * the Section is the grid container (so `divide-y` / `divide-x`
 * apply directly to the cells), the header spans all three
 * columns with its own `border-b`, and the cells are plain divs
 * with ForWho's label + body typography. No Card primitive, no
 * rounded corners, transparent background, no per-cell "Learn
 * more" link (the cells aren't clickable).
 *
 * The header adds a description paragraph on top of ForWho's
 * eyebrow + h2, since this section benefits from a one-line
 * subtitle. The header is otherwise ForWho verbatim.
 *
 * The 3-col layout on `md+` means two rows of three. `divide-y`
 * / `divide-x` operate in document order rather than visual
 * grid order, so the second-row cells get a redundant left
 * border against the section's left edge (1px against 1px, not
 * visually different). The vertical dividers between cells in
 * each row and the section's outer `border-b` still close the
 * layout cleanly.
 *
 * The TOC is the same source of truth that the deleted Preview
 * section used (`./content/toc.ts`), so the page-local grid
 * remains the single visible instance of the chapter list.
 */
export function WhatYouGet() {
  return (
    <Section className="grid grid-cols-1 md:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x divide-border">
      <div className="flex flex-col col-span-1 md:col-span-3 border-0">
        <div className="flex flex-col gap-2 p-6 border-b border-border">
          <p className="text-label-13 text-muted-foreground">What&apos;s inside</p>
          <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
            Six chapters from prompt to production
          </h2>
          <p className="text-copy-16 text-muted-foreground leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
            Each chapter opens with a moment you&apos;d recognise and
            closes with what to do about it.
          </p>
        </div>
      </div>
      {PLAYBOOK_TOC.map((entry) => (
        <div
          key={entry.id}
          className="flex flex-col transition-colors hover:bg-accent/40"
        >
          <p className="text-label-13 text-muted-foreground p-6 pb-0">
            {entry.id}
          </p>
          <h3 className="text-heading-20 tracking-tight text-foreground !m-0 px-6 pt-2 pb-6">
            {entry.takeaway}
          </h3>
        </div>
      ))}
    </Section>
  )
}
