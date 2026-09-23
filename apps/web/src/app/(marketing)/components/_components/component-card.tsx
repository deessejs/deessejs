import Link from "next/link"

import type { CatalogueComponent } from "./components-list"
import { ComponentCardPreview } from "./component-card-preview"

type Props = {
  component: CatalogueComponent
}

/**
 * Single card in the `/components` and `/components/[category]`
 * grids. Aspect-video preview slot at the top, then name +
 * description. No live preview yet.
 *
 * Plain `<div>` rather than the shadcn `<Card>` primitive — the
 * primitive adds a `ring-1` and `bg-card` that double up against
 * the shared-border grid's per-cell borders. A flat `<div>` lets
 * the parent `<li>`'s `border-r` / `border-b` show through as the
 * only visible boundary, exactly like `template-grid.tsx`.
 *
 * Caller is responsible for wrapping the card in an `<li>` inside
 * a `<ul>` — see `component-list-grid.tsx` for the shared-border
 * recipe.
 */
export function ComponentCard({ component }: Props) {
  const href = `/components/${component.category}/${component.slug}`

  return (
    <Link
      href={href}
      aria-label={`Read the ${component.name} component`}
      className="group flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex h-full flex-col bg-background transition-colors group-hover:bg-accent/30">
        <ComponentCardPreview slug={component.slug} />
        <div className="flex flex-1 flex-col gap-3 p-6">
          <h2 className="text-label-16 leading-snug font-semibold tracking-tight text-balance">
            {component.name}
          </h2>
          <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
            {component.description}
          </p>
        </div>
      </div>
    </Link>
  )
}