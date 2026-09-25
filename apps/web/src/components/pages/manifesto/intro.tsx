/**
 * /manifesto — Intro prose section.
 *
 * Two-paragraph framing: who we are (small team building the
 * templates we wished existed) and what this document is
 * (rewritten whenever we need to remember why we're here).
 *
 * Rhythm: `space-y-4` (16px) between paragraph blocks. The two
 * paragraphs are different weights (text-copy-18 then
 * text-copy-16) so the gap reads as a paragraph break rather
 * than a stanza break. `space-y-*` only applies to non-first
 * children, so the `[&:not(:first-child)]:mt-0` override that
 * previously lived on each <p> has been removed.
 */
export function Intro() {
  return (
    <section className="space-y-4">
      <p className="text-copy-18 text-foreground leading-7">
        DeesseJS is the main app of a small team building the
        templates, contracts, and tooling we wished existed when
        we shipped our last product. We work in public, in the
        open, and in the same stack most of our readers will
        reach for tomorrow.
      </p>
      <p className="text-copy-16 text-muted-foreground leading-7">
        These six beliefs are the rules we hold each other to
        when the easy call is to ship something less careful.
        They are not a manifesto in the sense of a manifesto
        being authoritative. They are the document we rewrite
        whenever we need to remember why we&apos;re here.
      </p>
    </section>
  )
}
