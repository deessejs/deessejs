import Link from "next/link"
import { createElement } from "react"
import { Wrench } from "lucide-react"

import type { CatalogueBlock } from "./blocks-list"
import { BlockCardPreview } from "./block-card-preview"
import { BLOCK_ICONS } from "./block-icon"

type Props = {
  block: CatalogueBlock
}

/**
 * Single card in the `/blocks` and `/blocks/[category]` grids.
 * V1 dummy: aspect-video preview slot at the top, then name +
 * description. No live preview yet.
 *
 * Plain `<div>` rather than the shadcn `<Card>` primitive — see
 * the comment in `catalogue-card.tsx` for the rationale.
 * Same recipe as `CatalogueCard`.
 */
// Module-level icon map. Looked up by slug and rendered via
// `createElement` to satisfy the react-hooks/static-components
// rule (a `const Icon = ...` inside the render body would
// trigger it). Cast widens the `as const satisfies Record<...>`
// exact type to a plain indexable map.
const ICON_BY_SLUG = BLOCK_ICONS as unknown as Record<
  string,
  React.ComponentType<{ "aria-hidden"?: boolean; className?: string }>
>

export function BlocksCard({ block }: Props) {
  const href = `/blocks/${block.category}/${block.slug}`

  return (
    <li>
      <Link
        href={href}
        aria-label={`Read the ${block.name} block`}
        className="group flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="flex h-full flex-col bg-background transition-colors group-hover:bg-accent/30">
          <BlockCardPreview block={block} />
          <div className="flex flex-1 flex-col gap-3 p-6">
            <div className="flex items-start gap-3">
              {createElement(ICON_BY_SLUG[block.slug] ?? Wrench, {
                "aria-hidden": true,
                className: "text-muted-foreground mt-0.5 size-4 shrink-0",
              })}
              <h2 className="text-label-16 leading-snug font-semibold tracking-tight text-balance">
                {block.name}
              </h2>
            </div>
            <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
              {block.description}
            </p>
          </div>
        </div>
      </Link>
    </li>
  )
}