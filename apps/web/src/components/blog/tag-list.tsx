import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"

export function TagList({
  tags,
  size = "md",
}: {
  tags: string[]
  size?: "sm" | "md"
}) {
  if (tags.length === 0) return null
  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <li key={tag}>
          <Link href={`/blog/tag/${encodeURIComponent(tag)}`}>
            <Badge
              variant={size === "sm" ? "outline" : "secondary"}
              className="cursor-pointer transition-colors hover:bg-foreground hover:text-background"
            >
              {tag}
            </Badge>
          </Link>
        </li>
      ))}
    </ul>
  )
}
