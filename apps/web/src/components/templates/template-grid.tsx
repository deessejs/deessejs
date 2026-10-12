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
 * Border strategy (see `.claude/skills/tailwind-borders`):
 * Each cell draws its left and top border ONLY when it has a neighbor
 * in that direction. This keeps incomplete rows correctly delimited:
 * a card above an empty slot keeps its bottom edge because the
 * next cell's `border-t` paints it; the last card of an incomplete
 * row keeps its right edge because the wrapper provides the frame.
 *
 * - Mobile (1 col): every cell from the second onwards draws
 *   `border-t` (separator above).
 * - md (2 col): even cells draw `border-l`; cells from the third
 *   onwards draw `border-t` (top of the second row).
 * - lg (3 col): every cell that is NOT in column 1 draws `border-l`;
 *   cells from the fourth onwards draw `border-t` (top of the second
 *   row). A card in the last row keeps its right edge because the
 *   page-level wrapper (the templates body div) carries the frame.
 */
export const TemplateGrid = ({ templates, className }: TemplateGridProps) => {
  return (
    <ul
      data-testid="templates-grid"
      className={cn(
        "grid auto-rows-fr grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        "[&>li]:min-w-0 [&>li]:flex [&>li]:border-border",

        // Mobile: top separators from the second cell onwards.
        "[&>li:nth-child(n+2)]:max-md:border-t",

        // Two columns: left separator on every even cell; top
        // separator from the third cell onwards.
        "md:max-lg:[&>li:nth-child(2n)]:border-l",
        "md:max-lg:[&>li:nth-child(n+3)]:border-t",

        // Three columns: left separator on every cell that is NOT
        // the first in its row; top separator from the fourth cell
        // onwards (i.e. the second row's top edge).
        "lg:[&>li:not(:nth-child(3n+1))]:border-l",
        "lg:[&>li:nth-child(n+4)]:border-t",

        className,
      )}
    >
      {templates.map((template) => (
        <li key={template.slug} data-testid="templates-card">
          <TemplateCard template={template} />
        </li>
      ))}
    </ul>
  )
}
