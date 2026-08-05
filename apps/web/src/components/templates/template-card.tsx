import Link from "next/link"

import { Card } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import type { Template } from "@/lib/templates-api"
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
 *   │   preview slot 16:9     │  ← muted surface, image will land here
 *   ├─────────────────────────┤
 *   │  name           [cat]   │
 *   │  description (clamp 2)  │
 *   │  labels                  │
 *   └─────────────────────────┘
 *
 * The entire surface is a single anchor (Link) wrapping the card so
 * the click target is the full card, not just the title. No nested
 * interactive elements — labels are non-interactive badges.
 *
 * The card stays `rounded-none` so the grid renders as one
 * continuous table-like surface (see TemplateGrid). The preview
 * slot uses `bg-muted/40` so it reads as "image placeholder"
 * without text — once real screenshots are wired in, swap this
 * block for an <Image /> from next/image.
 *
 * Card height is flex-driven: the preview slot eats its 16:9 share,
 * the meta block fills the rest.
 */
export const TemplateCard = ({ template, className }: TemplateCardProps) => {
  return (
    <Card
      className={cn(
        "group justify-between rounded-none border-0 bg-background py-0 transition-colors hover:bg-accent/30",
        className,
      )}
    >
      <Link
        href={`/templates/${template.slug}`}
        aria-label={`View ${template.name} template`}
        className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div
          aria-hidden
          className="aspect-video w-full border-b border-border bg-muted/40"
        />
        <div className="flex h-full flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-label-16 leading-snug font-semibold tracking-tight">
              {template.name}
            </h2>
            <Badge variant="outline" className="shrink-0">
              {template.category}
            </Badge>
          </div>
          <p className="text-copy-14 text-muted-foreground line-clamp-2">
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