import { Card } from "@workspace/ui/components/card"

import { BELIEFS } from "@/lib/manifesto/beliefs"
import { slugify } from "@/lib/company/slugify"

/**
 * /manifesto — Beliefs section.
 *
 * Six belief Cards stacked vertically (`space-y-4`). Each
 * belief carries an explicit `id` (slugified from the number)
 * so the page-level <TableOfContents targetId="manifesto-body">
 * can scroll-spy to the right belief on click. The
 * <TableOfContents> primitive
 * (`apps/web/src/components/blog/table-of-contents.tsx`) also
 * backfills ids via DOM scanning if any are missing — the
 * explicit ids here keep the anchors stable and human-readable
 * across re-renders.
 *
 * Six belief values: 01..06. Slugified "01" → "01", "02" → "02",
 * etc., so the anchors are #01, #02, ... (the page does not
 * rely on the ids being readable; they exist for <a href="#...">
 * stability).
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
          <p className="text-copy-16 text-foreground leading-7 [&:not(:first-child)]:mt-0 max-w-3xl">
            {belief.body}
          </p>
        </Card>
      ))}
    </div>
  )
}
