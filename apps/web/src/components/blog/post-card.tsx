import Image from "next/image"
import Link from "next/link"
import { Clock } from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import type { Post } from "@/lib/blog/types"

import { AuthorAvatarLink } from "./author-avatar"
import { TagList } from "./tag-list"

/**
 * Card for one blog post. The entire card surface is a single link
 * to the post URL — clicking anywhere on the cover, title,
 * description, or footer navigates to the article.
 *
 * Nested links (the tag chips in the header, the overflow tag list
 * in the footer, and the author avatars in the footer) sit on top
 * of the card link via `relative z-10` so they remain individually
 * clickable without triggering the surrounding card navigation.
 *
 * The title is plain text — it would be a duplicate link target
 * with the wrapping `<Link>` and is redundant once the whole card
 * navigates.
 */
export function PostCard({ post, featured }: { post: Post; featured?: boolean }) {
  const hasCover = Boolean(post.cover)
  const authors = post.authors?.length ? post.authors : post.author ? [post.author] : []

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden rounded-none border-0 bg-background transition-colors hover:bg-accent/30">
      {hasCover ? (
        <div className="relative block aspect-video w-full overflow-hidden bg-muted">
          <Image
            src={post.cover!}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
          />
        </div>
      ) : null}

      <CardHeader className="pb-10">
        <div className="relative z-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <time dateTime={post.date}>{post.date}</time>
          {post.tags?.length > 0 ? (
            <>
              {post.tags.slice(0, 2).map((tag) => (
                <Link
                  key={tag}
                  href={`/blog/tag/${encodeURIComponent(tag)}`}
                  className="capitalize underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  {tag}
                </Link>
              ))}
            </>
          ) : null}
        </div>
        <CardTitle
          className={
            featured
              ? "mt-1 text-balance text-2xl tracking-tight"
              : "mt-1 text-balance text-xl tracking-tight"
          }
        >
          {post.title}
        </CardTitle>
        <CardDescription className="mt-2 line-clamp-3 text-sm text-muted-foreground">
          {post.description}
        </CardDescription>
      </CardHeader>

      <div className="mt-auto px-6 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="relative z-10 flex flex-wrap items-center gap-x-3 gap-y-1">
            {authors.map((a) => (
              <span
                key={a.handle}
                className="inline-flex items-center gap-2"
              >
                <AuthorAvatarLink author={a} size={20} asLink={false} />
                <span className="text-xs text-foreground">{a.name}</span>
                {a.role ? (
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {a.role}
                  </span>
                ) : null}
              </span>
            ))}
            {post.tags?.length > 2 ? (
              <TagList tags={post.tags.slice(2)} size="sm" />
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {post.readingTime} min read
            </span>
          </div>
        </div>
      </div>

      {/* Single link covering the whole card. Sits last so it
          overlays every interactive area; nested links use z-10 to
          stay individually clickable on top of this anchor. */}
      <Link
        href={post.url}
        aria-label={post.title}
        className="absolute inset-0 z-0"
      />
    </Card>
  )
}
