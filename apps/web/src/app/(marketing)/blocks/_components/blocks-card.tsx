import Link from "next/link"

import { Card } from "@workspace/ui/components/card"

import type { CatalogueBlock } from "./blocks-list"
import { getBlockIcon } from "./block-icon"

type Props = {
  block: CatalogueBlock
}

/**
 * Single card in the `/blocks` and `/blocks/[category]` grids.
 * V1 dummy: icon + name + description, no live preview.
 *
 * Whole card wrapped in a single `<Link>` to the leaf route.
 * Same shape as `CatalogueCard` in the components registry.
 */
export function BlocksCard({ block }: Props) {
  const Icon = getBlockIcon(block.slug)
  const href = `/blocks/${block.category}/${block.slug}`

  return (
    <li>
      <Link
        href={href}
        aria-label={`Read the ${block.name} block`}
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Card className="flex h-full flex-col gap-3 p-5 transition-colors group-hover:bg-accent/30 group-focus-visible:bg-accent/30">
          <header className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background"
            >
              <Icon className="size-5 text-muted-foreground" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-label-14 font-semibold tracking-tight text-foreground">
                {block.name}
              </span>
            </span>
          </header>
          <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
            {block.description}
          </p>
        </Card>
      </Link>
    </li>
  )
}