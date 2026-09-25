import { Badge } from "@workspace/ui/components/badge"
import { Card } from "@workspace/ui/components/card"

import { HORIZONS } from "@/lib/vision/horizons"

/**
 * /vision — Horizons section.
 *
 * Three <section> blocks (Now / Next / Beyond), each rendering
 * the label + status Badge, the tagline, and a vertical <ul> of
 * item <Card>s.
 *
 * Layout note (deliberate, do not "fix"): the items inside each
 * horizon are stacked vertically, not in a grid. The vertical
 * stack preserves the temporal reading order (each item builds
 * on the previous one in its horizon). A grid would flatten that
 * into equal-weight tiles and break the Now → Next → Beyond
 * progression that the page is built around.
 */
export function Horizons() {
  return (
    <>
      {HORIZONS.map((horizon) => (
        <section key={horizon.label} className="flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-heading-40 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
                {horizon.label}
              </h2>
              <Badge variant="secondary">{horizon.status}</Badge>
            </div>
            <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
              {horizon.tagline}
            </p>
          </header>

          {/*
           * Deliberate vertical stack: each horizon reads as a temporal
           * progression (Now → Next → Beyond), and the four items under
           * a horizon are read in order. A grid would flatten that
           * progression into equal-weight tiles.
           */}
          <ul className="flex flex-col gap-3">
            {horizon.items.map((item) => (
              <li key={item.title}>
                <Card className="flex flex-col gap-2 p-6">
                  <h3 className="text-heading-20 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
                    {item.title}
                  </h3>
                  <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
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
