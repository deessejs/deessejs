import Link from "next/link"
import Image from "next/image"

import { Card } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import type { TemplateV1 as Template } from "@workspace/contracts/v1"
import { TemplateLabels } from "./template-labels"

export type TemplateCardProps = {
  template: Template
  className?: string
}

/**
 * A clickable card representing one template in the index grid.
 *
 * Layout (Vercel-style):
 *   ┌─────────────────────────┐
 *   │   tilted hero (3:2)     │  ← rotated image slot, image lands here
 *   ├─────────────────────────┤
 *   │  name           [cat]   │
 *   │  description            │
 *   │  labels                  │
 *   └─────────────────────────┘
 *
 * The entire surface is a single anchor (Link) wrapping the card so
 * the click target is the full card, not just the title. No nested
 * interactive elements — labels are non-interactive badges.
 *
 * The card stays `rounded-none` so the grid renders as one
 * continuous table-like surface (see TemplateGrid). The hero block
 * mirrors the latest-guides carousel chrome: outer frame, then a
 * `-rotate-3` tilted inner frame holding the actual screenshot. Same
 * `-rotate-3 origin-bottom-right translate-x-[10%] translate-y-[10%]`
 * transform as `latest-guides-section.tsx`.
 *
 * Card height is flex-driven: the hero block eats its aspect share,
 * the meta block fills the rest.
 */
export const TemplateCard = ({ template, className }: TemplateCardProps) => {
  return (
    <Card
      className={cn(
        "group justify-between rounded-none border-0 bg-background py-0 transition-colors hover:bg-accent/40",
        className,
      )}
    >
      <Link
        href={`/templates/${template.slug}`}
        aria-label={`View ${template.name} template`}
        className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {template.image ? (
          <div className="border-t border-border bg-background p-4">
            <div
              aria-hidden
              className={cn(
                "-rotate-3 origin-bottom-right translate-x-[10%] translate-y-[10%]",
                "relative aspect-video overflow-hidden rounded-md border bg-background",
              )}
            >
              <Image
                src={template.image}
                alt={`${template.name} preview`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
          </div>
        ) : (
          <div
            aria-hidden
            className="aspect-video w-full shrink-0 border-b border-border bg-muted/40"
          />
        )}
        <div className="flex min-h-40 flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-heading-20 lg:text-heading-24 tracking-tight !m-0 text-balance">
              {template.name}
            </h2>
            <Badge variant="outline" className="shrink-0">
              {template.category}
            </Badge>
          </div>
          <p className="text-copy-14 text-muted-foreground leading-6 !m-0 text-balance">
            {template.description}
          </p>
          <div className="mt-auto">
            <TemplateLabels labels={template.labels} />
          </div>
        </div>
      </Link>
    </Card>
  )
}