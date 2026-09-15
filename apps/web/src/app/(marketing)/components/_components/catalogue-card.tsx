import Link from "next/link"

import { Card } from "@workspace/ui/components/card"

import type { CatalogueComponent } from "./components-list"
import { getComponentIcon } from "./component-icon"

type Props = {
  component: CatalogueComponent
}

/**
 * Single card in the `/components` and `/components/[category]`
 * grids. V1 dummy: icon + name + description, no live preview.
 *
 * The whole card is wrapped in a single `<Link>` to the leaf
 * route, matching the `TemplateCard` pattern at
 * `apps/web/src/components/templates/template-card.tsx:48-73`.
 * One anchor per card — no nested interactives.
 */
export function CatalogueCard({ component }: Props) {
  const Icon = getComponentIcon(component.slug)
  const href = `/components/${component.category}/${component.slug}`

  return (
    <li>
      <Link
        href={href}
        aria-label={`Read the ${component.name} component`}
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
                {component.name}
              </span>
            </span>
          </header>
          <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
            {component.description}
          </p>
        </Card>
      </Link>
    </li>
  )
}