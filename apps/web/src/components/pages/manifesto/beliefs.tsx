import { BELIEFS } from "@/lib/manifesto/beliefs"

/**
 * /manifesto — Beliefs section.
 *
 * Six <article> rows, each with the numeric mono label + h2
 * title + body paragraph. The gap-12 between articles is
 * deliberate: each belief is a block narrative, not a card,
 * and the vertical air gives each one its own reading beat.
 */
export function Beliefs() {
  return (
    <section className="flex flex-col gap-12">
      {BELIEFS.map((belief) => (
        <article key={belief.number} className="flex flex-col gap-3">
          <header className="flex items-baseline gap-4">
            <span className="text-label-16 font-mono text-muted-foreground">
              {belief.number}
            </span>
            <h2 className="text-heading-24 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
              {belief.title}
            </h2>
          </header>
          <p className="text-copy-16 text-foreground leading-7 [&:not(:first-child)]:mt-0">
            {belief.body}
          </p>
        </article>
      ))}
    </section>
  )
}
