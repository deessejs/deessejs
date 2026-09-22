import type { CatalogueBlock } from "./blocks-list"

type Props = {
  block: CatalogueBlock
}

/**
 * Mini preview of a single block, rendered inside the 16:9 slot
 * at the top of each block card on `/blocks` and `/blocks/[category]`.
 *
 * Mirrors the layout discriminator (`split` | `stacked` | `bento` |
 * `centered`) with a mocked mini-arrangement sized to fit a 16:9
 * surface. Calque of the pattern in `block-preview.tsx:25-93`,
 * scaled down for the card slot.
 *
 * V1 dummy: each layout gets a single representative mock. V2
 * will render the actual section composed from primitives.
 */
export function BlockCardPreview({ block }: Props) {
  return (
    <div className="flex aspect-video w-full shrink-0 items-center justify-center bg-muted/40 p-4">
      {renderMock(block)}
    </div>
  )
}

function renderMock(block: CatalogueBlock) {
  const { layout } = block
  return (
    <div className="flex w-full max-w-full flex-col gap-1 text-label-13 text-muted-foreground">
      <span className="font-mono uppercase tracking-wider">
        {layout} layout
      </span>
      <div
        aria-hidden
        className="relative w-full overflow-hidden border border-dashed border-border bg-muted/20 p-2"
      >
        {layout === "split" ? (
          <div className="grid grid-cols-2 gap-1">
            <div className="space-y-1">
              <div className="h-1.5 w-2/3 rounded bg-muted/60" />
              <div className="h-1.5 w-1/2 rounded bg-muted/40" />
            </div>
            <div className="aspect-video w-full rounded bg-muted/40" />
          </div>
        ) : layout === "stacked" ? (
          <div className="space-y-1">
            <div className="h-1.5 w-3/4 rounded bg-muted/60" />
            <div className="h-1.5 w-1/2 rounded bg-muted/40" />
            <div className="h-4 w-full rounded bg-muted/40" />
            <div className="h-1.5 w-2/3 rounded bg-muted/40" />
          </div>
        ) : layout === "bento" ? (
          <div className="grid grid-cols-3 gap-1">
            <div className="col-span-2 row-span-2 h-10 rounded bg-muted/60" />
            <div className="h-5 rounded bg-muted/40" />
            <div className="h-5 rounded bg-muted/40" />
            <div className="col-span-3 h-3 rounded bg-muted/40" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-2">
            <div className="h-1.5 w-2/3 rounded bg-muted/60" />
            <div className="h-1.5 w-1/2 rounded bg-muted/40" />
            <div className="mt-1 h-3 w-8 rounded bg-muted/60" />
          </div>
        )}
      </div>
    </div>
  )
}