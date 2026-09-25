import { Card } from "@workspace/ui/components/card"

import { BELIEFS } from "@/lib/manifesto/beliefs"

/**
 * /manifesto — Beliefs section.
 *
 * Six belief Cards stacked vertically (`space-y-4`). The Card
 * surface replaces the previous plain `<article>` rows so the
 * section reads as six visibly-distinct blocks instead of a
 * wall of similar prose (the previous version was the most
 * "monotonous" of the five pages — commit 13 section 13).
 *
 * Each Card carries:
 * - The mono numeric prefix in a top-level visual slot
 *   (text-label-16 font-mono).
 * - The belief title at text-heading-24 (the prior H2 size,
 *   matches the inner header convention across the
 *   app).
 * - The body paragraph at text-copy-16 text-foreground
 *   (commit 6 rebalance — was muted).
 *
 * `space-y-4` between beliefs inside the section is the
 * default intra-card rhythm; the outer `space-y-12` between
 * sections (in `page.tsx`) gives the 48px block-narrative beat
 * that this section is known for.
 */
export function Beliefs() {
  return (
    <div className="space-y-4">
      {BELIEFS.map((belief) => (
        <Card key={belief.number} className="space-y-3 p-6">
          <div className="flex items-baseline gap-4">
            <span className="text-label-16 font-mono text-muted-foreground">
              {belief.number}
            </span>
            <h2 className="text-heading-24 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
              {belief.title}
            </h2>
          </div>
          <p className="text-copy-16 text-foreground leading-7 [&:not(:first-child)]:mt-0 max-w-3xl">
            {belief.body}
          </p>
        </Card>
      ))}
    </div>
  )
}
