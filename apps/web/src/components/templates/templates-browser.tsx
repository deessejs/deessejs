"use client"

import {
  Suspense,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react"
import { useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"

import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { TemplateV1 as Template } from "@workspace/contracts/v1"
import {
  CATEGORY_LABELS,
  FRAMEWORK_LABELS,
} from "@workspace/api/templates-labels"
import { TemplateGrid } from "./template-grid"

/**
 * Reduce a `URLSearchParams`-derived value to a deduplicated
 * list of allowed strings. Mirrors the previous server-side
 * helper so the filter behaviour is unchanged.
 */
const toFilterList = (
  raw: string | string[] | undefined,
  allowed: ReadonlyArray<string>,
): string[] => {
  const values = Array.isArray(raw) ? raw : raw ? [raw] : []
  const set = new Set<string>(allowed)
  const out: string[] = []
  for (const v of values) {
    if (set.has(v)) out.push(v)
  }
  return Array.from(new Set(out))
}

/**
 * Client-side filter UI for /templates.
 *
 * Renders the search input and the live-filtered grid against a
 * statically-provided registry. Reads the active filters from the
 * URL on mount via `useSearchParams`, so the initial paint is
 * driven by the registry while deep links keep working — even
 * with the backend fully unreachable.
 *
 * History API sync:
 *   The page is built as a static HTML document. A filter change
 *   pushes the new `?type=` / `?framework=` state onto the
 *   browser history with `window.history.replaceState` rather than
 *   navigating. The browser never re-fetches the catalog from
 *   the server, so the page can never collapse to the empty
 *   state.
 *
 * Suspense boundary:
 *   `useSearchParams` forces the surrounding component into the
 *   client suspense boundary. The outer `TemplatesBrowserShell`
 *   keeps the search input responsive even while React resolves
 *   the params on first paint.
 */
const TemplatesBrowserInner = ({
  allTemplates,
}: {
  allTemplates: ReadonlyArray<Template>
}) => {
  const inputId = useId()
  const search = useSearchParams()

  // Derive initial filters from the URL. We intentionally compute
  // it on mount only — once the user starts typing or clicking,
  // their in-component state takes over until they refresh.
  const initialTypes = useMemo(
    () =>
      toFilterList(search?.getAll("type"), Object.keys(CATEGORY_LABELS)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const initialFrameworks = useMemo(
    () =>
      toFilterList(
        search?.getAll("framework"),
        Object.keys(FRAMEWORK_LABELS),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLowerCase()

  const filtered = useMemo(() => {
    const typeSet = new Set(initialTypes)
    const activeTypes = Array.from(typeSet)
    return allTemplates.filter((template) => {
      const matchesType =
        activeTypes.length === 0 || typeSet.has(template.category)
      const matchesFramework =
        initialFrameworks.length === 0 ||
        initialFrameworks.some((framework) =>
          template.labels.includes(framework),
        )
      if (!matchesType || !matchesFramework) return false
      if (normalizedQuery.length === 0) return true
      const haystack = [
        template.name,
        template.description,
        ...template.labels,
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [allTemplates, initialTypes, initialFrameworks, normalizedQuery])

  // Mirror initial filter state to the URL once on mount so a
  // visitor arriving on `/templates?type=desktop` keeps that
  // shareable URL after refresh even though we already painted
  // the right state from the registry.
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams()
    for (const t of initialTypes) params.append("type", t)
    for (const f of initialFrameworks) params.append("framework", f)
    const qs = params.toString()
    const currentQs = window.location.search.replace(/^\?/, "")
    if (qs !== currentQs) {
      const next = qs.length > 0 ? `/templates?${qs}` : "/templates"
      window.history.replaceState(null, "", next)
    }
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={cn("flex flex-col")}>
      <div className="p-4 border-b border-border">
        <div className="relative ">
          <Search
            aria-hidden
            className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2"
          />
          <Input
            id={inputId}
            type="search"
            data-testid="templates-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search templates…"
            aria-label="Search templates"
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
      </div>

      {filtered.length === 0 ? (
        <p
          data-testid="templates-no-results"
          className="text-copy-16 text-muted-foreground p-4"
        >
          No templates match the current filters.
        </p>
      ) : (
        <TemplateGrid templates={[...filtered]} />
      )}
    </div>
  )
}

/**
 * Wraps `TemplatesBrowserInner` in a Suspense boundary so the
 * `useSearchParams` call does not block the entire page tree.
 * `Suspense` is required when the component reads search params
 * during static generation; the fallback here is the full grid
 * (no filters applied) so the page is never empty.
 */
export const TemplatesBrowser = ({
  allTemplates,
  className,
}: {
  allTemplates: ReadonlyArray<Template>
  className?: string
}) => {
  return (
    <div className={cn("flex flex-col", className)}>
      <Suspense
        fallback={
          <TemplateGrid templates={[...allTemplates]} />
        }
      >
        <TemplatesBrowserInner allTemplates={allTemplates} />
      </Suspense>
    </div>
  )
}
