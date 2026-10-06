import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Two-column simulated product section.
 *
 * Used by the use-case pages to render copy + a product mockup side
 * by side, alternating left/right across consecutive sections.
 *
 * - On lg viewports, `reverse=true` swaps the two columns so the
 *   mockup appears on the left and the copy on the right.
 * - On mobile (single column), the mockup appears first so the
 *   visitor sees the product before reading the copy.
 *
 * Lives inside the page's shared-border wrapper. The wrapper owns
 * the outer border; this component owns its content. The parent
 * grid supplies the `border-t` between sections.
 */
export function SimulatedSection({
  eyebrow,
  title,
  body,
  bullets,
  mockup,
  reverse = false,
}: {
  eyebrow: string
  title: string
  body: string
  bullets: ReadonlyArray<string>
  mockup: React.ReactNode
  reverse?: boolean
}) {
  return (
    <div className="grid grid-cols-1 border-t border-border lg:grid-cols-2 lg:divide-x lg:divide-border">
      <div
        className={cn(
          // Mobile: copy sits below the mockup
          "order-2 flex flex-col gap-4 p-6 lg:p-10",
          // Desktop: copy on the left by default, on the right when reversed
          reverse ? "lg:order-2" : "lg:order-1",
        )}
      >
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="max-w-xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
          {title}
        </h2>
        <p className="max-w-xl text-copy-16 leading-7 text-muted-foreground">
          {body}
        </p>
        <ul className="flex flex-col gap-2">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 text-copy-14 leading-6 text-muted-foreground"
            >
              <span
                aria-hidden
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500"
              />
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div
        className={cn(
          // Mobile: mockup first
          "order-1 !p-0 border-0",
          // Desktop: mockup on the right by default, on the left when reversed
          reverse ? "lg:order-1" : "lg:order-2",
        )}
      >
        <div className="relative m-4 overflow-hidden rounded-none border border-border bg-background lg:m-6">
          {mockup}
        </div>
      </div>
    </div>
  )
}

/**
 * One tile in the "And more" grid. No status vocabulary — every
 * capability is presented as live, no shipped/roadmap distinction.
 */
export type MoreTile = {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

/**
 * The "And more" grid: dense 3-col showcase of capabilities that
 * don't get their own simulation. Capabilities are presented
 * timelessly — no shipped/roadmap badges.
 */
export function AndMoreSection({ tiles }: { tiles: ReadonlyArray<MoreTile> }) {
  return (
    <div className="border-t border-border">
      <div className="flex flex-col gap-3 border-b border-border p-6 lg:p-10">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          And more
        </p>
        <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
          Six more capabilities.
        </h2>
      </div>
      <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-3 lg:!divide-x-0">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <div
              key={tile.id}
              className="flex flex-col gap-3 p-6 lg:p-8"
            >
              <span className="flex size-7 w-fit items-center justify-center rounded-md border border-border bg-muted/40 p-1.5">
                <Icon className="size-4 text-foreground" aria-hidden />
              </span>
              <h3 className="text-heading-20 font-medium tracking-tight text-foreground">
                {tile.title}
              </h3>
              <p className="text-copy-14 leading-6 text-muted-foreground">
                {tile.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
