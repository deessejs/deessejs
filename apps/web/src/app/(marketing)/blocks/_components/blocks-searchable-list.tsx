"use client"

import { useDeferredValue, useMemo, useState } from "react"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { SearchInput } from "@/app/(marketing)/components/_components/search-input"
import { getBlockIcon } from "./block-icon"
import type { CatalogueBlock } from "./blocks-list"
import type { BlockCategory } from "./block-categories"

type Props = {
  blocks: ReadonlyArray<CatalogueBlock>
  category: BlockCategory
}

/**
 * Client wrapper for the `/blocks/[category]` sidebar list.
 * Mirrors `CategorySearchableList` in the components registry:
 * text search above the list, filters by name (case-insensitive
 * substring match), empty-state message inline.
 *
 * V1 dummy: no active-state highlight. V2 will read `usePathname()`
 * from a client wrapper to mark the current leaf.
 */
export function BlocksSearchableList({ blocks, category }: Props) {
  const [query, setQuery] = useState("")
  const deferred = useDeferredValue(query)
  const normalized = deferred.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (normalized.length === 0) return blocks
    return blocks.filter((block) =>
      block.name.toLowerCase().includes(normalized),
    )
  }, [blocks, normalized])

  return (
    <aside className="flex w-full flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
      <h2 className="text-label-13 uppercase tracking-wider text-muted-foreground">
        {category.name}
      </h2>
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={`Search ${category.name.toLowerCase()}…`}
        aria-label={`Search blocks in ${category.name}`}
      />
      {filtered.length === 0 ? (
        <p
          role="status"
          aria-live="polite"
          className="text-copy-13 text-muted-foreground px-1 py-2"
        >
          No blocks match &ldquo;{deferred}&rdquo;.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {filtered.map((block) => {
            const Icon = getBlockIcon(block.slug)
            return (
              <li key={block.slug}>
                <Link
                  href={`/blocks/${category.slug}/${block.slug}`}
                  aria-label={`Read the ${block.name} block`}
                  className="group flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2 transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Icon
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="text-label-14 font-medium text-foreground flex-1 truncate">
                    {block.name}
                  </span>
                  <ChevronRight
                    className="size-3 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}