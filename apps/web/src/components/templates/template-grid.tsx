import { cn } from "@workspace/ui/lib/utils"

import type { TemplateV1 as Template } from "@workspace/contracts/v1"
import { TemplateCard } from "./template-card"

export type TemplateGridProps = {
  templates: Template[]
  className?: string
}

/**
 * Responsive grid: 1 col mobile, 2 col md, 3 col lg.
 *
 * Height strategy:
 * - `auto-rows-fr` makes every row the same height (the height of the
 *   tallest card in that row), so cards across rows align and the
 *   `mt-auto` labels in `TemplateCard` pin consistently to the bottom.
 * - `flex` on each `<li>` lets the child Card fill the cell height.
 *   The Card itself is `h-full` (see `TemplateCard`).
 *
 * Border strategy (Pattern B — see `.claude/skills/tailwind-borders`):
 * - Each cell carries `border-r border-b` always.
 * - The inner `<ul>` shifts by `-mr-px -mb-px` so the last column's
 *   right border and the last row's bottom border are clipped by the
 *   wrapper's `overflow-hidden` instead of doubling against the page
 *   frame. No `nth-child` selectors, no per-breakpoint toggle.
 * - The wrapper does NOT carry its own `border` (unlike the blog
 *   grid): the page already frames the catalogue (sidebar divider,
 *   hero `border-b`, CTA `border-t`). Adding a wrapper border would
 *   produce double rules against the surrounding chrome.
 *
 * Incomplete rows are correctly delimited: a card above an empty
 * slot keeps its bottom edge (the cell still has `border-b`); the
 * last card of an incomplete row keeps its right edge (the cell
 * still has `border-r`). The clipping only removes the borders that
 * touch the wrapper's outer edge.
 */
export const TemplateGrid = ({ templates, className }: TemplateGridProps) => {
  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-none bg-background",
        className,
      )}
    >
      <ul
        data-testid="templates-grid"
        className="-mr-px -mb-px grid auto-rows-fr list-none grid-cols-1 gap-0 p-0 md:grid-cols-2 lg:grid-cols-3"
      >
        {templates.map((template) => (
          <li
            key={template.slug}
            data-testid="templates-card"
            className="flex min-w-0 border-r border-b border-border"
          >
            <TemplateCard template={template} />
          </li>
        ))}
      </ul>
    </div>
  )
}
