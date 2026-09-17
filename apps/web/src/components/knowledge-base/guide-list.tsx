"use client"

import { useDeferredValue, useMemo, useState } from "react"
import Link from "next/link"
import { Search, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { GuideProductPill } from "./badges"

type GuideListItem = {
  slug: string
  title: string
  description: string
  url: string
  products: string[]
}

/**
 * Client-side search + tag filter for the All Guides list.
 *
 * - Search input filters by title and description (case-insensitive).
 * - Tag filter is a single `<Select>` that filters guides whose
 *   `products` include the selected tag. Select "All" to clear.
 * - `useDeferredValue` keeps the input responsive when the corpus
 *   grows beyond the current 6 seeded guides.
 */
export function GuideList({
  guides,
  availableTags,
}: {
  guides: GuideListItem[]
  availableTags: string[]
}) {
  const [query, setQuery] = useState("")
  const [tagFilter, setTagFilter] = useState<string>("__all__")
  const deferred = useDeferredValue(query)

  const filtered = useMemo(() => {
    const q = deferred.trim().toLowerCase()
    const matchText = (guide: GuideListItem) =>
      !q ||
      guide.title.toLowerCase().includes(q) ||
      guide.description.toLowerCase().includes(q)
    const matchTag = (guide: GuideListItem) =>
      tagFilter === "__all__" || guide.products.includes(tagFilter)

    return guides.filter(
      (guide) => matchText(guide) && matchTag(guide),
    )
  }, [guides, deferred, tagFilter])

  const hasFilters = query.length > 0 || tagFilter !== "__all__"
  const showEmpty = hasFilters && filtered.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Filter
          </span>
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="h-9 min-w-[160px] border-border bg-background">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {availableTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guides…"
            aria-label="Search guides"
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

      {showEmpty ? (
        <div className="border border-dashed border-border px-6 py-10 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            No guides match
          </p>
          <p className="mt-2 text-copy-14 text-muted-foreground text-pretty">
            Try a different keyword or clear the active filters.
          </p>
        </div>
      ) : (
        <ul
          className="m-0 flex flex-col list-none divide-y divide-border p-0"
          data-guide-list-count={filtered.length}
        >
          {filtered.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={guide.url}
                aria-label={`Read the ${guide.title} guide`}
                className="group flex flex-col gap-2 px-2 py-4 transition-colors hover:bg-accent/30 focus-visible:bg-accent/30 focus-visible:outline-none"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-balance text-base font-medium tracking-tight text-foreground underline-offset-4 group-hover:underline">
                    {guide.title}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.products.slice(0, 3).map((product) => (
                      <GuideProductPill key={product}>
                        {product}
                      </GuideProductPill>
                    ))}
                  </div>
                </div>
                <span className="text-copy-14 text-muted-foreground leading-6 text-pretty">
                  {guide.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
