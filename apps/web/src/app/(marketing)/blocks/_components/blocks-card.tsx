import Link from "next/link"

import type { CatalogueBlock } from "./blocks-list"
import { BlockCardPreview } from "./block-card-preview"
import { getBlockIcon } from "./block-icon"

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
export function BlocksCard({ block }: Props) {
  const Icon = getBlockIcon(block.slug)
  const href = `/blocks/${block.category}/${block.slug}`

  return (
    <li>
      <Link
        href={href}
        aria-label={`Read the ${block.name} block`}
        className="group flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="flex h-full flex-col bg-background transition-colors group-hover:bg-accent/30">
          <BlockCardPreview slug={block.slug} />
          <div className="flex flex-1 flex-col gap-3 p-6">
            <div className="flex items-start gap-3">
              <Icon
                aria-hidden
                className="text-muted-foreground mt-0.5 size-4 shrink-0"
              />
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