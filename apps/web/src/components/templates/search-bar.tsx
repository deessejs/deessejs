"use client"

import { useDeferredValue, useId, useMemo, useState } from "react"
import { Search, X } from "lucide-react"

import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { Template } from "@/lib/templates-api"
import { TemplateGrid } from "./template-grid"

export type SearchableTemplateGridProps = {
  templates: Template[]
  /**
   * Active category for the empty-state copy. When a search query
   * yields no matches, the message mentions the active category so
   * users know what they were looking at.
   */
  categoryLabel: string
  className?: string
}

/**
 * Wraps `TemplateGrid` with a live-search input. The query is
 * applied client-side against `name` and `description` (case
 * insensitive). Filtered matches render in the same grid as
 * the server-rendered version.
 *
 * `useDeferredValue` keeps the input responsive on slow renders —
 * typing stays snappy even when the filtered list re-renders.
 */
export const SearchableTemplateGrid = ({
  templates,
  categoryLabel,
  className,
}: SearchableTemplateGridProps) => {
  const inputId = useId()
  const [query, setQuery] = useState("")
  const deferred = useDeferredValue(query)
  const normalized = deferred.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (normalized.length === 0) return templates
    return templates.filter((template) => {
      const haystack = [
        template.name,
        template.description,
        ...template.labels,
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(normalized)
    })
  }, [templates, normalized])

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="relative">
        <Search
          aria-hidden
          className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2"
        />
        <Input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search templates…"
          aria-label={`Search templates in ${categoryLabel}`}
          className="pl-9 pr-10"
        />
        {query.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="text-copy-16 text-muted-foreground">
          No templates match{" "}
          <span className="text-copy-14-mono">&quot;{deferred}&quot;</span> in {categoryLabel}.
        </p>
      ) : (
        <TemplateGrid templates={filtered} />
      )}
    </div>
  )
}