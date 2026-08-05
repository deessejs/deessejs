import { cn } from "@workspace/ui/lib/utils"

import type { Template } from "@/lib/templates-api"
import { TemplateCard } from "./template-card"

export type TemplateGridProps = {
  templates: Template[]
  className?: string
}

/**
 * Responsive grid: 1 col mobile, 2 col md, 3 col lg.
 *
 * Card surface treatment:
 * - `gap-0` so adjacent cards share a single border, no double-rule.
 * - `bg-background` and `rounded-none` (set on the Card itself) so
 *   the grid reads as one continuous table-like surface rather than
 *   a stack of floating tiles.
 * - Dividers are drawn per-card with `border-r border-b border-border`.
 *   The last card in each row drops its right border via
 *   `[&:nth-child(3n)]:border-r-0`; the last row drops its bottom
 *   border via `[&:nth-last-child(-n+3)]:border-b-0`. This avoids
 *   Tailwind's known `divide-*` issue (tailwindlabs/tailwindcss#18265)
 *   on grid containers, and stays portable across all browsers
 *   without depending on `row-rule` / `column-rule` (CSS Gap
 *   Decorations — not Baseline yet).
 */
export const TemplateGrid = ({ templates, className }: TemplateGridProps) => {
  return (
    <ul
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        "[&>li]:border-r [&>li]:border-b [&>li]:border-border",
        "[&>li:nth-child(2n)]:md:border-r-0",
        "[&>li:nth-child(3n)]:lg:border-r-0",
        "[&>li:nth-last-child(-n+2)]:md:border-b-0",
        "[&>li:nth-last-child(-n+3)]:lg:border-b-0",
        className,
      )}
    >
      {templates.map((template) => (
        <li key={template.slug}>
          <TemplateCard template={template} />
        </li>
      ))}
    </ul>
  )
}