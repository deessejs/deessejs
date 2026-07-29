import Link from "next/link"
import { Calendar } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
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

export function ReleaseEntry({ release }: { release: Release }) {
  return (
    <Card className="group transition-colors hover:border-foreground/30 hover:bg-muted/30">
      <CardHeader>
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
        <CardTitle className="text-balance text-xl tracking-tight">
          <Link
            href={release.url}
            className="transition-colors hover:text-foreground"
          >
            {release.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
          {release.description}
        </CardDescription>
      </CardHeader>
      <div className="px-6 pb-6">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="size-3" />
          <time dateTime={release.date}>{release.date}</time>
        </div>
      </div>
    </Card>
  )
}
