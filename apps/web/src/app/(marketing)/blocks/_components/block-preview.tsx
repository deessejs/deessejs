import type { CatalogueBlock } from "./blocks-list"

type Props = {
  block: CatalogueBlock
}

/**
 * V1 live preview of a single block. Renders a labelled mock
 * surface sized by the block's `layout` discriminator:
 *
 * - `split`     → wide rectangle with a divider line
 * - `stacked`   → tall rectangle with stacked internal sections
 * - `bento`     → grid of cells (2x2)
 * - `centered`  → centered narrow rectangle
 *
 * V2 will replace this with an actual rendered section by
 * composing the underlying primitives + layout.
 */
export function BlockPreview({ block }: Props) {
  const { layout, name } = block

  return (
    <div className="flex min-h-64 items-center justify-center p-8">
      <PreviewMock layout={layout} name={name} />
    </div>
  )
}

function PreviewMock({
  layout,
  name,
}: {
  layout: CatalogueBlock["layout"]
  name: string
}) {
  return (
    <div className="flex w-full max-w-md flex-col gap-2 text-label-13 text-muted-foreground">
      <span className="font-mono uppercase tracking-wider">
        {layout} layout
      </span>
      <div
        aria-hidden
        className="relative w-full overflow-hidden border border-dashed border-border bg-muted/20 p-4"
      >
        {layout === "split" ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-3 w-2/3 rounded bg-muted/60" />
              <div className="h-3 w-1/2 rounded bg-muted/40" />
            </div>
            <div className="aspect-video w-full rounded bg-muted/40" />
          </div>
        ) : layout === "stacked" ? (
          <div className="space-y-3">
            <div className="h-3 w-3/4 rounded bg-muted/60" />
            <div className="h-3 w-1/2 rounded bg-muted/40" />
            <div className="h-12 w-full rounded bg-muted/40" />
            <div className="h-3 w-2/3 rounded bg-muted/40" />
          </div>
        ) : layout === "bento" ? (
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 row-span-2 h-20 rounded bg-muted/60" />
            <div className="h-10 rounded bg-muted/40" />
            <div className="h-10 rounded bg-muted/40" />
            <div className="col-span-3 h-6 rounded bg-muted/40" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="h-3 w-2/3 rounded bg-muted/60" />
            <div className="h-3 w-1/2 rounded bg-muted/40" />
            <div className="mt-2 h-6 w-20 rounded bg-muted/60" />
          </div>
        )}
      </div>
      <span className="text-center font-mono">{name}</span>
    </div>
  )
}