import { Calendar } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import type { Release, ReleaseCategory } from "@/lib/blog/types"
import { RELEASE_CATEGORY_LABELS } from "@/lib/blog/types"

const CATEGORY_VARIANT: Record<ReleaseCategory, "default" | "secondary" | "outline"> = {
  added: "default",
  changed: "secondary",
  fixed: "secondary",
  deprecated: "outline",
  removed: "outline",
  security: "default",
}

export function ReleaseMeta({ release }: { release: Release }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground/80">
          v{release.version}
        </code>
        {release.categories.map((cat) => (
          <Badge
            key={cat}
            variant={CATEGORY_VARIANT[cat]}
            className="text-xs"
          >
            {RELEASE_CATEGORY_LABELS[cat]}
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-1 text-xs">
        <Calendar className="size-3.5" />
        <time dateTime={release.date}>{release.date}</time>
      </div>
    </div>
  )
}
