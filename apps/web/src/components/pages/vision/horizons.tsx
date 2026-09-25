import { Badge } from "@workspace/ui/components/badge"
import { Card } from "@workspace/ui/components/card"

import { HORIZONS } from "@/lib/vision/horizons"
import { slugify } from "@/lib/company/slugify"

/**
 * /vision — Horizons section.
 *
 * Three <section> blocks (Now / Next / Beyond), each rendering
 * the label + status Badge, the tagline, and a vertical <ul> of
 * item <Card>s.
 *
 * Each item carries an explicit `id` (slugified from the
 * horizon label + item title) so the page-level
 * <TableOfContents targetId="vision-body"> can scroll-spy
 * to the right item. The pattern matches the blog's
 * rehypeHeadingIds plugin approach; ids here are stable
 * because they derive from data, not from textContent
 * mutations.
 *
 * Layout note (deliberate, do not "fix"): the items inside each
 * horizon are stacked vertically, not in a grid. The vertical
 * stack preserves the temporal reading order (each item builds
 * on the previous one in its horizon). A grid would flatten that
 * into equal-weight tiles and break the Now → Next → Beyond
 * progression that the page is built around.
 *
 * Rhythm: per-horizon section space-y-6, items ul space-y-3,
 * Card space-y-2.
 */
export function Horizons() {
  return (
    <>
      {HORIZONS.map((horizon) => (
        <section key={horizon.label} className="space-y-6">
          <header className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-heading-40 tracking-tight text-foreground">
                {horizon.label}
              </h2>
              <Badge variant="secondary">{horizon.status}</Badge>
            </div>
            <p className="text-copy-16 text-foreground leading-7 max-w-3xl">
              {horizon.tagline}
            </p>
          </header>

          <ul className="space-y-3">
            {horizon.items.map((item) => (
              <li key={item.title}>
                <Card className="space-y-2 p-6">
                  <h3
                    id={`horizon-${slugify(horizon.label)}-${slugify(item.title)}`}
                    className="text-heading-20 tracking-tight text-foreground"
                  >
                    {item.title}
                  </h3>
                  <p className="text-copy-14 text-foreground leading-7">
                    {item.description}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}
