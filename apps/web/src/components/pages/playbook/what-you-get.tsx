import { PLAYBOOK_TOC } from "./content/toc"

/**
 * /playbook "What you'll find" section.
 *
 * Lays out the chapter takeaways as a numbered list in reading
 * order so scrollers can decide quickly whether the playbook
 * addresses what they need. Each item is a verb-first capability
 * phrased against the concrete situation the reader is in.
 *
 * Heading recipe: `text-heading-32 tracking-tight`. List recipe:
 * `text-copy-16 leading-7 text-foreground` with `list-decimal`
 * markers and `pl-7` indent.
 */
export function WhatYouGet() {
  return (
    <section
      aria-labelledby="playbook-what-heading"
      className="border-b border-border px-6 py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <h2
          id="playbook-what-heading"
          className="text-heading-32 tracking-tight"
        >
          What you&apos;ll find in the guide
        </h2>
        <ol className="flex flex-col gap-4 pl-7 text-copy-16 leading-7 text-foreground [&:not(:first-child)]:mt-0 [counter-reset:playbook]">
          {PLAYBOOK_TOC.map((entry) => (
            <li
              key={entry.id}
              className="list-decimal"
              value={Number(entry.id)}
            >
              {entry.takeaway}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
