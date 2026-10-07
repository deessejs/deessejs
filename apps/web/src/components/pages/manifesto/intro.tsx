/**
 * /manifesto — Intro prose section.
 *
 * Two-paragraph framing: who we are (small team building the
 * templates we wished existed) and what this document is
 * (rewritten whenever we need to remember why we're here).
 *
 * Rhythm: `space-y-4` (16px) between paragraph blocks. The
 * two paragraphs carry different weights (text-copy-18 then
 * text-copy-16) so the gap reads as a paragraph break rather
 * than a stanza break. Each paragraph carries `max-w-3xl`
 * (~75ch at 16px) for senior prose readability — without
 * it, the body rides at the page-level max-w-5xl (1024px) and
 * lines run 85-95ch.
 */
export function Intro() {
  return (
    <section className="space-y-4">
      <p className="max-w-3xl text-copy-18 text-foreground leading-7">
        DeesseJS is the main app of a small team building the
        templates, contracts, and tooling we wished existed when
        we shipped our last product. We work in public, in the
        open, and in the same stack most of our readers will
        reach for tomorrow.
      </p>
      <p className="max-w-3xl text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
        These six beliefs are the rules we hold each other to
        when the easy call is to ship something less careful.
        They are not a manifesto in the sense of a manifesto
        being authoritative. They are the document we rewrite
        whenever we need to remember why we&apos;re here.
      </p>
    </section>
  )
}
