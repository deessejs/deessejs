import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

export type TemplateLabelsProps = {
  labels: string[] | undefined
  /** Maximum number of badges to render before collapsing into "+N". */
  max?: number
  className?: string
}

/**
 * Render a template's labels as badges. The first `max` (default 3)
 * are shown as individual badges; the rest collapse into a single
 * muted "+N" pill so the card never grows taller than its grid siblings.
 *
 * Defensive against `labels === undefined`: a missing field on the
 * upstream template payload (GitHub API hiccup, registry drift)
 * previously threw `TypeError: Cannot read properties of undefined
 * (reading 'length')` and broke the entire `/templates` SSR render.
 * Production logs (digest `551940582`) confirmed the crash site.
 * We now render nothing for an absent/empty array — same UX as the
 * empty case, no exception.
 */
export const TemplateLabels = ({
  labels,
  max = 3,
  className,
}: TemplateLabelsProps) => {
  if (!labels || labels.length === 0) return null
  const visible = labels.slice(0, max)
  const overflow = labels.length - visible.length

  return (
    <ul
      className={cn(
        "flex flex-nowrap items-center gap-1.5 overflow-hidden",
        className,
      )}
    >
      {visible.map((label) => (
        <li key={label} className="min-w-0 shrink">
          <Badge variant="secondary" className="block truncate">
            {label}
          </Badge>
        </li>
      ))}
      {overflow > 0 ? (
        <li className="shrink-0">
          <Badge variant="outline" className="text-muted-foreground">
            +{overflow}
          </Badge>
        </li>
      ) : null}
    </ul>
  )
}
