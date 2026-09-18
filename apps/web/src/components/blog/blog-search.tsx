"use client"

import { useDeferredValue, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { Search, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import type { Post } from "@/lib/blog/types"

import { BlogPostGrid } from "./blog-post-grid"

/**
 * Client root that owns the search query and renders the input next
 * to the topics nav, then the filtered results below.
 *
 * `topics` (a ReactNode) is rendered server-side and passed in as
 * children — this keeps the topics nav links server-rendered while
 * lifting only the search state into a Client Component.
 */
export function BlogSearch({
  posts,
  featured,
  topics,
}: {
  posts: Post[]
  featured?: Post[] | undefined
  topics?: ReactNode
}) {
  const [query, setQuery] = useState("")
  const deferred = useDeferredValue(query)

  const filtered = useMemo(() => {
    const q = deferred.trim().toLowerCase()
    if (!q) return posts
    return posts.filter((post) => {
      if (post.title.toLowerCase().includes(q)) return true
      if (post.description.toLowerCase().includes(q)) return true
      if (post.tags.some((tag) => tag.toLowerCase().includes(q))) return true
      return false
    })
  }, [posts, deferred])

  const isSearching = deferred.trim().length > 0
  const showEmpty = isSearching && filtered.length === 0

  return (
    <div className="flex flex-col" data-blog-search-query={query}>
      {topics ? (
        <div className="flex flex-col gap-4 border-x border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
          <div className="flex flex-1 flex-wrap items-center gap-2">{topics}</div>
          <div className="relative w-full shrink-0 sm:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts…"
              aria-label="Search posts"
              className="pl-9 pr-9"
            />
            {query.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {showEmpty ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border px-6 py-16 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            No results
          </p>
          <p className="mt-3 max-w-md text-pretty text-base text-muted-foreground">
            No posts match{" "}
            <span className="font-mono text-foreground">
              &ldquo;{deferred.trim()}&rdquo;
            </span>
            . Try a different keyword or browse{" "}
            <Link
              href="/blog"
              className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
            >
              all posts
            </Link>
            .
          </p>
        </div>
      ) : (
        <BlogPostGrid
          posts={filtered}
          featured={isSearching ? undefined : featured}
        />
      )}
    </div>
  )
}
