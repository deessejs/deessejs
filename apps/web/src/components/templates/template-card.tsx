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
 * Layout (mirrors `latest-guides-section.tsx`):
 *   ┌─────────────────────────┐
 *   │   tilted hero (3:2)     │  ← rotated image slot, image lands here
 *   ├─────────────────────────┤
 *   │  name           [cat]   │  ← opaque panel sits in front of the hero
 *   │  description            │     so the rotated visual does not bleed
 *   │  labels                  │     over the text.
 *   └─────────────────────────┘
 *
 * Two chrome details matter for the hero:
 *
 * 1. The hero block has NO `overflow-hidden` on the outer panel. The
 *    rotation and translation push the visual outside the panel; that
 *    vertical overflow is intentional and what gives the card its
 *    "lifted" feel. Clipping happens on the surface (the panel is
 *    opaque, the content sits in front of it via z-10).
 *
 * 2. The content panel is `relative z-10` + `bg-background` + `flex-1`,
 *    identical to the `latest-guides-section.tsx` content block. Without
 *    the opaque background, the rotated image would bleed through the
 *    gaps between title / description / labels.
 *
 * Geometry is single-shape: the `with / without image` branches
 * collapse into one wrapper, with only the image content conditional.
 * The image-less variant renders a muted placeholder inside the same
 * tilted frame, so the separation line between hero and content stays
 * at the same y-offset whether the image exists or not.
 *
 * The hero wrapper carries no border; the unique internal separator
 * is the `border-t` on the content panel below. The tilted frame
 * inside the hero still carries its own `border` because that border
 * belongs to the illustration, not to the card's outer chrome.
 *
 * Card height is flex-driven by the grid (see `template-grid.tsx`
 * `auto-rows-fr` + `flex` on `<li>` + `h-full` on the Card). The
 * shadcn Card ships with a `flex flex-col gap-(--card-spacing)`
 * layout and a `ring-1 ring-foreground/10` outline; both are
 * neutralised here (`gap-0`, `ring-0`) because the grid already
 * manages layout and spacing, and the page-level chrome provides
 * the outer frame. `overflow-hidden` on the Card contains the
 * rotated hero's visual overflow inside the card surface.
 */
export const TemplateCard = ({ template, className }: TemplateCardProps) => {
  return (
    <Card
      className={cn(
        "group relative isolate h-full w-full min-w-0 gap-0 overflow-hidden rounded-none border-0 bg-background py-0 ring-0 transition-colors hover:bg-accent/40",
        className
      )}
    >
      <Link
        href={`/templates/${template.slug}`}
        aria-label={`View ${template.name} template`}
        className="flex h-full min-w-0 flex-col focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      >
        {/* Hero — opaque panel (no border; the separator above the
            content is drawn by the content panel's own `border-t`
            below). The inner rotated frame keeps the same
            `-rotate-3` chrome as `latest-guides-section.tsx`. */}
        <div className="shrink-0 bg-background p-4">
          <div
            aria-hidden
            className={cn(
              "origin-bottom-right translate-x-[10%] translate-y-[10%] -rotate-3",
              "relative aspect-video overflow-hidden rounded-md border border-border bg-background"
            )}
          >
            {template.image ? (
              <Image
                src={template.image}
                alt={`${template.name} preview`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            ) : (
              <div className="h-full bg-muted/40" />
            )}
          </div>
        </div>

        {/* Content — opaque panel, in front of the hero via z-10.
            The single `border-t` here is the unique internal
            separator between the hero and the content. `flex-1`
            absorbs the leftover row height so the labels row can
            pin to the bottom via `mt-auto`. */}
        <div className="relative z-10 flex min-h-40 flex-1 flex-col gap-4 border-t border-border bg-background p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="!m-0 text-heading-20 tracking-tight text-balance lg:text-heading-24">
              {template.name}
            </h2>
            <Badge variant="outline" className="shrink-0">
              {template.category}
            </Badge>
          </div>
          <p className="!m-0 text-copy-14 leading-6 text-balance text-muted-foreground">
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
