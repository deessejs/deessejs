import Link from "next/link"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { AvatarNextImage } from "./avatar-image"
import type { Author } from "@/lib/blog/types"

function SingleAuthorBlock({ author }: { author: Author }) {
  const fallback = author.name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const authorUrl = `/blog/author/${encodeURIComponent(author.handle)}`

  return (
    <div className="flex items-start gap-4">
      <Link href={authorUrl} aria-label={`More from ${author.name}`} className="shrink-0">
        <Avatar className="size-12 overflow-hidden rounded-full">
          {author.avatar ? (
            <AvatarNextImage src={author.avatar} alt={author.name} />
          ) : null}
          <AvatarFallback className="text-sm font-semibold">
            {fallback || author.name[0]}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={authorUrl}
          className="inline-block text-base font-semibold tracking-tight text-foreground transition-colors hover:text-foreground/80"
        >
          {author.name}
        </Link>
        {author.bio ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {author.bio}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function AuthorBio({
  authors,
  author,
}: {
  authors?: Author[]
  author?: Author
}) {
  const list: Author[] =
    authors && authors.length > 0
      ? authors
      : author
        ? [author]
        : []

  if (list.length === 0) return null

  return (
    <aside className="mt-12 rounded-xl border border-border/40 bg-muted/20 p-6">
      <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Written by
      </p>
      {list.length === 1 ? (
        <SingleAuthorBlock author={list[0]!} />
      ) : (
        <div className="space-y-6">
          {list.map((a) => (
            <SingleAuthorBlock key={a.handle} author={a} />
          ))}
        </div>
      )}
    </aside>
  )
}
