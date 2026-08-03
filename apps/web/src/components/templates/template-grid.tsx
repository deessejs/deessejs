import { cn } from "@workspace/ui/lib/utils"

import type { Template } from "@/lib/templates-api"
import { TemplateCard } from "./template-card"

export type TemplateGridProps = {
  templates: Template[]
  className?: string
}

/**
 * Responsive grid: 1 col mobile, 2 col md, 3 col lg. Consistent
 * spacing with the rest of the site (gap-6 = 24px, per DESIGN.md §2.6).
 */
export const TemplateGrid = ({ templates, className }: TemplateGridProps) => {
  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
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
