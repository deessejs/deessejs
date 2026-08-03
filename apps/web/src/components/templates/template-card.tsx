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
 * The entire surface is a single anchor (Link) wrapping the card so
 * the click target is the full card, not just the title. No nested
 * interactive elements — labels are non-interactive badges.
 *
 * V1 design: minimal. No image, no hover-elevate. The card stays
 * consistent in height so the grid aligns cleanly. Description is
 * clamped to 2 lines via `line-clamp-2` (line-clamp is widely
 * supported as of 2022; no JS truncation needed).
 */
export const TemplateCard = ({ template, className }: TemplateCardProps) => {
  return (
    <Card
      className={cn(
        "group h-48 justify-between transition-colors hover:bg-accent/30",
        className,
      )}
    >
      <Link
        href={`/templates/${template.slug}`}
        className="flex h-full flex-col justify-between gap-4 p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
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
        <TemplateLabels labels={template.labels} />
      </Link>
    </Card>
  )
}
