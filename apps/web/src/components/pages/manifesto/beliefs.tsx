import { BELIEFS } from "@/lib/manifesto/beliefs"

/**
 * /manifesto — Beliefs section.
 *
 * Six <article> rows, each with the numeric mono label + h2
 * title + body paragraph.
 *
 * Rhythm:
 * - Outer `space-y-12` (48px) between beliefs (deliberate: each
 *   belief is a block narrative, not a card, and the vertical
 *   air gives each one its own reading beat).
 * - Inner `space-y-4` (16px) between the <header> (number +
 *   title) and the body paragraph. The previous `gap-3` was
 *   12px which read as too tight against the 4-5 line body
 *   paragraphs.
 *
 * `space-y-*` only applies to non-first children, so the
 * `[&:not(:first-child)]:mt-0` override on h2 and p is
 * redundant and has been removed.
 */
export function Beliefs() {
  return (
    <section className="space-y-12">
      {BELIEFS.map((belief) => (
        <article key={belief.number} className="space-y-4">
          <header className="flex items-baseline gap-4">
            <span className="text-label-16 font-mono text-muted-foreground">
              {belief.number}
            </span>
            <h2 className="text-heading-24 tracking-tight text-foreground">
              {belief.title}
            </h2>
          </header>
          <p className="text-copy-16 text-foreground leading-7">
            {belief.body}
          </p>
        </article>
      ))}
    </section>
  )
}
