import Link from "next/link"
import type { ReactNode } from "react"

type Props = {
  /** Final URL of the card. */
  href: string
  /** Accessible label read by screen readers in place of the visual title. */
  ariaLabel: string
  /**
   * 16:9 preview slot at the top of the card. The surfaces each
   * render whatever suits them: components pass the actual shadcn
   * primitive, blocks pass a layout-shaped mock. Slot-based so the
   * chrome stays content-free.
   */
  preview: ReactNode
  /** Card title. */
  title: ReactNode
  /** Card description / body copy. */
  description: ReactNode
  /** Optional small footer line shown beneath the description. */
  footer?: ReactNode
}

/**
 * Catalog chrome: grid card.
 *
 * Single card in the `/<surface>` and `/<surface>/[category]`
 * grids. Renders an `aspect-video` preview slot at the top (filled
 * by the caller via the `preview` prop), then a title +
 * description. Optional `footer` slot is used by the blocks
 * category grid to print one extra `<span>` with the first block
 * slug.
 *
 * Plain `<div>` rather than the shadcn `<Card>` primitive — the
 * primitive adds a `ring-1` and `bg-card` that double up against
 * the shared-border grid's per-cell borders. A flat `<div>` lets
 * the parent `<li>`'s `border-r` / `border-b` show through as the
 * only visible boundary, exactly like the pre-refactor cards.
 *
 * Pre-refactor: this was duplicated as
 * `component-card.tsx` (used the per-component `slug` to derive
 * the href) and `blocks-card.tsx` (rendered a BlockCardPreview).
 * Both have been replaced with calls to this component — the
 * preview and the href are now passed by the caller, the card
 * itself stays chrome-only.
 */
export function CatalogCard({
  href,
  ariaLabel,
  preview,
  title,
  description,
  footer,
}: Props) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="group flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex h-full flex-col bg-background transition-colors group-hover:bg-accent/30">
        {preview}
        <div className="flex flex-1 flex-col gap-3 p-6">
          <h2 className="text-label-16 leading-snug font-semibold tracking-tight text-balance">
            {title}
          </h2>
          <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
            {description}
          </p>
          {footer}
        </div>
      </div>
    </Link>
  )
}
