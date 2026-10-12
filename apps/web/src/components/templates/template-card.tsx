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
 * Card height is flex-driven by the grid (see `template-grid.tsx`
 * `auto-rows-fr` + `flex` on `<li>` + `h-full` on the Card). The Card
 * does not impose a min-height; the panel's `min-h-40` is a safety
 * floor so a card with a very short description still has readable
 * chrome.
 */
export const TemplateCard = ({ template, className }: TemplateCardProps) => {
  return (
    <Card
      className={cn(
        "group relative isolate flex h-full min-w-0 w-full flex-col gap-0 overflow-hidden rounded-none border-0 bg-background py-0 ring-0 transition-colors hover:bg-accent/40",
        className,
      )}
    >
      <Link
        href={`/templates/${template.slug}`}
        aria-label={`View ${template.name} template`}
        className="flex min-w-0 flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {/* Hero — outer panel is opaque so the rotated visual's
            bottom edge does not bleed into the page background, and
            so the content panel has a clean surface to sit on. The
            inner rotated frame keeps the same `-rotate-3` chrome as
            `latest-guides-section.tsx`. */}
        <div className="shrink-0 border-t border-border bg-background p-4">
          <div
            aria-hidden
            className={cn(
              "-rotate-3 origin-bottom-right translate-x-[10%] translate-y-[10%]",
              "relative aspect-video overflow-hidden rounded-md border border-border bg-background",
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
            flex-1 lets it absorb the leftover row height so the
            labels row can pin to the bottom via mt-auto. */}
        <div className="relative z-10 flex min-h-40 flex-1 flex-col gap-4 border-t border-border bg-background p-6 lg:p-8">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-heading-20 tracking-tight !m-0 text-balance lg:text-heading-24">
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
