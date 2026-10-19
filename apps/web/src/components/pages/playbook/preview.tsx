import { PLAYBOOK_TOC } from "./content/toc"

/**
 * /playbook "Preview" section.
 *
 * Shows the cover thumbnail alongside the chapter list so a skeptical
 * reader can judge the level and shape of the PDF before giving up
 * their email. Real cover image goes here once the asset lands; until
 * then a labeled placeholder keeps the layout honest.
 *
 * Layout: two-column on md+, stacked on mobile. The cover takes the
 * narrower column (~200px wide), the chapter card takes the rest.
 * Both stack under a shared `border-b border-border` with the same
 * vertical padding rhythm as the other sections.
 */
export function Preview() {
  return (
    <section
      aria-labelledby="playbook-preview-heading"
      className="border-b border-border px-6 py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <h2
          id="playbook-preview-heading"
          className="text-heading-32 tracking-tight"
        >
          A look inside the PDF
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr] md:items-start">
          {/* TODO(v0.2): replace this placeholder with the real cover
              image — `apps/web/public/playbook/cover.png` linked via
              next/image. Sized to match the column (~200px) and the
              PDF aspect ratio (~3:4). The alt text must match the
              visible cover title verbatim for accessibility. */}
          <div
            aria-label="Playbook cover — placeholder until the real PDF lands"
            className="flex h-72 w-48 items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-center text-label-13 text-muted-foreground"
          >
            Cover — TODO
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-label-14 font-semibold uppercase tracking-wider text-muted-foreground [&:not(:first-child)]:mt-0">
              Table of contents
            </h3>
            <ol className="mt-3 flex flex-col gap-2 pl-5 text-copy-14 leading-6 text-foreground [&:not(:first-child)]:mt-0">
              {PLAYBOOK_TOC.map((entry) => (
                <li key={entry.id} className="list-decimal" value={Number(entry.id)}>
                  {entry.takeaway}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-label-13 text-muted-foreground [&:not(:first-child)):mt-0">
              {/* TODO(v0.2): ~60 pages — finalised when the layout lands. */}
              ~60 pages
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
