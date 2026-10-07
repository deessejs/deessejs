import { Card } from "@workspace/ui/components/card"

import { BELIEFS } from "@/lib/manifesto/beliefs"
import { slugify } from "@/lib/company/slugify"

/**
 * /manifesto — Beliefs section.
 *
 * Six belief Cards stacked vertically (`space-y-4`). Each
 * belief carries an explicit `id` so the page-level
 * <TableOfContents targetId="manifesto-body"> can scroll-spy
 * to the right belief on click.
 *
 * One belief per page is flagged as a pull-quote (see
 * `lib/manifesto/beliefs.ts`). The pull-quote is rendered
 * inside a raw <blockquote> with a custom restyle — the
 * package <Blockquote> doesn't accept className (only
 * children), so we inline the element here. The restyle is
 * `border-l-4 border-primary pl-6 italic text-copy-16
 * text-muted-foreground` — heavier left-border (4px in
 * `--primary` instead of the default 2px in `--border`)
 * gives the quote a deliberate visual anchor inside the
 * card.
 *
 * Six belief values: 01..06. Slugified "01" → "01", etc., so
 * the anchors are #01, #02, etc. The TableOfContents
 * primitive also backfills ids from textContent if any are
 * missing — explicit ids keep the anchors stable.
 */
export function Beliefs() {
  return (
    <div className="space-y-4">
      {BELIEFS.map((belief) => (
        <Card
          key={belief.number}
          id={`belief-${slugify(belief.number)}`}
          className="space-y-3 p-6"
        >
          <div className="flex items-baseline gap-4">
            <span className="text-label-16 font-mono text-muted-foreground">
              {belief.number}
            </span>
            <h2 className="text-heading-24 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
              {belief.title}
            </h2>
          </div>
          {belief.pullQuote ? (
            <blockquote className="border-l-4 border-primary pl-6 italic text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0 max-w-3xl">
              {belief.body}
            </blockquote>
          ) : (
            <p className="text-copy-16 text-foreground leading-7 [&:not(:first-child)]:mt-0 max-w-3xl">
              {belief.body}
            </p>
          )}
        </Card>
      ))}
    </div>
  )
}
