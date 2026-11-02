"use client"

import {
  useDeferredValue,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import type { Post } from "@/lib/blog/types"
import { BLOG_PAGE_SIZE } from "@/lib/blog/posts"

import { PostCardGrid } from "./blog-post-grid"

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
  page = 1,
}: {
  posts: ReadonlyArray<Post>
  featured?: ReadonlyArray<Post> | undefined
  topics?: ReactNode
  page?: number
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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(page * BLOG_PAGE_SIZE, posts.length)
  )
  const [loading, setLoading] = useState(false)
  const visible = isSearching ? filtered : filtered.slice(0, visibleCount)
  const nextPage = Math.floor(visibleCount / BLOG_PAGE_SIZE) + 1
  const nextUrl = new URLSearchParams(searchParams.toString())
  nextUrl.set("page", String(nextPage))
  const nextHref = `${pathname}?${nextUrl.toString()}`

  useEffect(() => {
    function restoreHistoryState(event: PopStateEvent) {
      const url = new URL(window.location.href)
      const urlPage = Number(url.searchParams.get("page")) || 1
      const stateCount = event.state?.blogVisibleCount
      setVisibleCount(
        typeof stateCount === "number"
          ? stateCount
          : Math.min(urlPage * BLOG_PAGE_SIZE, posts.length)
      )
    }
    window.addEventListener("popstate", restoreHistoryState)
    return () => window.removeEventListener("popstate", restoreHistoryState)
  }, [posts.length])

  function loadMore() {
    if (loading || visibleCount >= filtered.length) return
    setLoading(true)
    const count = Math.min(visibleCount + BLOG_PAGE_SIZE, filtered.length)
    setVisibleCount(count)
    setLoading(false)
    window.history.pushState(
      { ...window.history.state, blogVisibleCount: count },
      "",
      nextHref
    )
  }

  return (
    <div className="flex flex-col" data-blog-search-query={query}>
      {topics ? (
        <div className="flex flex-col gap-4 border-x border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {topics}
          </div>
          <div className="relative w-full shrink-0 sm:w-72">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts…"
              aria-label="Search posts"
              className="pr-9 pl-9"
            />
            {query.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {showEmpty ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border px-6 py-16 text-center">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            No results
          </p>
          <p className="mt-3 max-w-md text-base text-pretty text-muted-foreground">
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
        <PostCardGrid
          posts={visible}
          featured={isSearching ? undefined : featured}
        />
      )}
      {!isSearching && !showEmpty && visibleCount < filtered.length ? (
        <div className="flex justify-center border-x border-b border-border py-6">
          <a
            href={nextHref}
            aria-label={`Go to blog posts page ${nextPage}`}
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            Next page
          </a>
          <Button
            type="button"
            disabled={loading}
            aria-label={`Load blog posts page ${nextPage}`}
            aria-busy={loading}
            onClick={loadMore}
          >
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
