import Link from "next/link"
import { Calendar, Clock } from "lucide-react"
import { Separator } from "@workspace/ui/components/separator"
import type { Post } from "@/lib/blog/types"
import { TagList } from "./tag-list"

function formatAuthorNames(authors: Post["authors"]): React.ReactNode {
  if (authors.length === 0) return null
  if (authors.length === 1) {
    const first = authors[0]!
    return (
      <Link
        href={`/blog/author/${encodeURIComponent(first.handle)}`}
        className="transition-colors hover:text-foreground"
      >
        {first.name}
      </Link>
    )
  }
  if (authors.length === 2) {
    const a0 = authors[0]!
    const a1 = authors[1]!
    return (
      <>
        <Link
          href={`/blog/author/${encodeURIComponent(a0.handle)}`}
          className="transition-colors hover:text-foreground"
        >
          {a0.name}
        </Link>
        {" and "}
        <Link
          href={`/blog/author/${encodeURIComponent(a1.handle)}`}
          className="transition-colors hover:text-foreground"
        >
          {a1.name}
        </Link>
      </>
    )
  }
  return (
    <>
      {authors.slice(0, -1).map((a, i) => (
        <span key={a.handle}>
          {i > 0 ? ", " : ""}
          <Link
            href={`/blog/author/${encodeURIComponent(a.handle)}`}
            className="transition-colors hover:text-foreground"
          >
            {a.name}
          </Link>
        </span>
      ))}
      {", and "}
      <Link
        href={`/blog/author/${encodeURIComponent(authors[authors.length - 1]!.handle)}`}
        className="transition-colors hover:text-foreground"
      >
        {authors[authors.length - 1]!.name}
      </Link>
    </>
  )
}

export function PostMeta({ post }: { post: Post }) {
  const authors = post.authors?.length
    ? post.authors
    : post.author
      ? [post.author]
      : []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="text-foreground/90">
            by {formatAuthorNames(authors)}
          </span>
        </span>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3.5" />
            <time dateTime={post.date}>{post.date}</time>
          </span>
          <Separator orientation="vertical" className="h-3" />
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {post.readingTime} min read
          </span>
        </div>
      </div>
      {post.tags.length > 0 ? (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tags
          </span>
          <TagList tags={post.tags} />
        </div>
      ) : null}
    </div>
  )
}
