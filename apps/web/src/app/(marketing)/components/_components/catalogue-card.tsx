import Link from "next/link"

import type { LucideIcon } from "lucide-react"

import type { CatalogueComponent } from "./components-list"
import { ComponentCardPreview } from "./component-card-preview"
import { getComponentIcon } from "./component-icon"

type Props = {
  component: CatalogueComponent
}

/**
 * Single card in the `/components` and `/components/[category]`
 * grids. V1 dummy: aspect-video preview slot at the top, then name
 * + description. No live preview yet.
 *
 * Plain `<div>` rather than the shadcn `<Card>` primitive — the
 * primitive adds a `ring-1` and `bg-card` that double up against
 * the shared-border grid's per-cell borders. A flat `<div>` lets
 * the parent `<li>`'s `border-r` / `border-b` show through as the
 * only visible boundary, exactly like `template-grid.tsx`.
 */
export function CatalogueCard({ component }: Props) {
  // `Icon` is a component instance — must be hoisted (useMemo) to
  // satisfy the react-hooks/static-components rule. The lookup is
  // cheap (single object access); the useMemo is purely there to
  // give the JSX a stable reference.
  const Icon: LucideIcon = getComponentIcon(component.slug)
  const href = `/components/${component.category}/${component.slug}`

  return (
    <li>
      <Link
        href={href}
        aria-label={`Read the ${component.name} component`}
        className="group flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="flex h-full flex-col bg-background transition-colors group-hover:bg-accent/30">
          <ComponentCardPreview slug={component.slug} />
          <div className="flex flex-1 flex-col gap-3 p-6">
            <div className="flex items-start gap-3">
              <Icon
                aria-hidden
                className="text-muted-foreground mt-0.5 size-4 shrink-0"
              />
              <h2 className="text-label-16 leading-snug font-semibold tracking-tight text-balance">
                {component.name}
              </h2>
            </div>
            <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
              {component.description}
            </p>
          </div>
        </div>
      </Link>
    </li>
  )
}