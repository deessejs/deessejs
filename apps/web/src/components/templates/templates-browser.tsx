"use client"

import {
  Suspense,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react"
import Link from "next/link"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Search, X } from "lucide-react"

import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import type { TemplateV1 as Template } from "@workspace/contracts/v1"
import {
  CATEGORY_LABELS,
  FRAMEWORK_LABELS,
  type CategorySlug,
  type FrameworkSlug,
} from "@workspace/api/templates-labels"

import { TemplateGrid } from "./template-grid"

/**
 * /templates client surface — sidebar + grid + search, all reading
 * and writing the same URL state.
 *
 * Why the entire body is one client component:
 *
 *   The previous design split this surface across a server component
 *   (`page.tsx`) and a smaller client child (`TemplatesBrowser`). The
 *   sidebar stayed on the server, passed `activeTypes={[]}` and
 *   `activeFrameworks={[]}` to the CategorySidebar, and relied on
 *   `<Link>` clicks to navigate. That meant the filter UI never
 *   reflected active state, the search bar was in a different tree
 *   than the sidebar, and switching framework/category always
 *   re-rendered the whole page tree.
 *
 *   This module now owns the full surface. Both the sidebar and the
 *   grid render inside the same client component so they share URL
 *   state via `useSearchParams`/`useRouter`. The sidebar's `<a>` is
 *   replaced with a click handler that pushes the new URL through
 *   the router — letting Next.js' App Router handle the History API,
 *   back/forward, and Suspense boundaries consistently with the rest
 *   of the app.
 *
 * URL contract:
 *
 *   - `?type=foo&type=bar` — multi-select categories.
 *   - `?framework=foo`      — multi-select frameworks.
 *   - Unknown values are silently dropped (they are filtered against
 *     the canonical taxonomy on read).
 *   - When all filters are cleared, the URL drops both keys
 *     entirely — `?type=` empty is removed.
 */
type FilterValue = string

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

const matchesTemplate = (
  template: Template,
  types: ReadonlySet<string>,
  frameworks: ReadonlyArray<string>,
  haystackLower: string | null,
): boolean => {
  if (types.size > 0 && !types.has(template.category)) return false
  if (frameworks.length > 0) {
    if (!frameworks.some((f) => template.labels.includes(f))) return false
  }
  if (haystackLower !== null) {
    const haystack = `${template.name} ${template.description} ${template.labels.join(" ")}`.toLowerCase()
    if (!haystack.includes(haystackLower)) return false
  }
  return true
}

const CATEGORIES = Object.entries(CATEGORY_LABELS).map(
  ([slug, label]) => ({ slug: slug as CategorySlug, label }),
) as ReadonlyArray<{ slug: CategorySlug; label: string }>

const FRAMEWORKS = Object.entries(FRAMEWORK_LABELS).map(
  ([slug, label]) => ({ slug: slug as FrameworkSlug, label }),
) as ReadonlyArray<{ slug: FrameworkSlug; label: string }>

const FiltersSidebar = ({
  templates,
  activeTypes,
  activeFrameworks,
  onToggle,
}: {
  templates: ReadonlyArray<Template>
  activeTypes: ReadonlyArray<string>
  activeFrameworks: ReadonlyArray<string>
  onToggle: (key: "type" | "framework", value: string) => void
}) => {
  const visibleFrameworks = FRAMEWORKS.filter(({ slug }) =>
    templates.some((t) => t.labels.includes(slug)),
  )
  const activeTypeSet = new Set(activeTypes)
  const activeFrameworkSet = new Set(activeFrameworks)
  const totalShown = templates.length

  return (
    <aside className="w-full lg:sticky lg:top-20 lg:self-start">
      <div className="flex flex-col gap-6">
        <FilterGroup
          title="Type"
          paramKey="type"
          entries={CATEGORIES.map(({ slug, label }) => ({ slug, label }))}
          activeValues={activeTypes}
          otherValues={activeFrameworks}
          activeSet={activeTypeSet}
          onToggle={onToggle}
          countFor={(slug) => templates.filter((t) => t.category === slug).length}
          data-testid="templates-sidebar-type"
        />
        <FilterGroup
          title="Framework"
          paramKey="framework"
          entries={visibleFrameworks}
          activeValues={activeFrameworks}
          otherValues={activeTypes}
          activeSet={activeFrameworkSet}
          onToggle={onToggle}
          countFor={(slug) =>
            templates.filter((t) => t.labels.includes(slug)).length
          }
          data-testid="templates-sidebar-framework"
        />
        <p
          data-testid="templates-sidebar-count"
          className="text-copy-13 text-muted-foreground/70"
        >
          {totalShown} template{totalShown === 1 ? "" : "s"} in catalog
        </p>
        {(activeTypes.length > 0 || activeFrameworks.length > 0) && (
          <button
            type="button"
            onClick={() => {
              for (const t of activeTypes) onToggle("type", t)
              for (const f of activeFrameworks) onToggle("framework", f)
            }}
            className="text-copy-13 text-muted-foreground underline-offset-4 hover:underline text-left"
            data-testid="templates-sidebar-clear"
          >
            Clear all filters
          </button>
        )}
      </div>
    </aside>
  )
}

const FilterGroup = ({
  title,
  entries,
  activeValues,
  activeSet,
  onToggle,
  countFor,
  "data-testid": dataTestId,
}: {
  title: string
  paramKey: "type" | "framework"
  entries: ReadonlyArray<{ slug: string; label: string }>
  activeValues: ReadonlyArray<string>
  otherValues: ReadonlyArray<string>
  activeSet: ReadonlySet<string>
  onToggle: (key: "type" | "framework", value: string) => void
  countFor: (slug: string) => number
  "data-testid"?: string
}) => {
  return (
    <div data-testid={dataTestId}>
      <h3 className="text-label-13 mb-3 font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <ul className="flex flex-col gap-1">
        {entries.map((entry) => {
          const isActive = activeSet.has(entry.slug)
          const count = countFor(entry.slug)
          return (
            <li key={entry.slug}>
              <label
                className={cn(
                  "text-label-13 flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-1.5 text-left transition-colors hover:bg-accent hover:text-foreground",
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Input
                    type="checkbox"
                    readOnly
                    checked={isActive}
                    tabIndex={-1}
                    aria-hidden
                    className="pointer-events-none size-3.5 shrink-0 rounded-sm border-border accent-foreground"
                  />
                  {entry.label}
                </span>
                <button
                  type="button"
                  onClick={() => onToggle(title === "Type" ? "type" : "framework", entry.slug)}
                  className="text-copy-13 text-muted-foreground/70"
                  aria-label={`Toggle ${entry.label}`}
                  data-testid={`sidebar-toggle-${entry.slug}`}
                >
                  {count}
                </button>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const SearchBox = ({
  query,
  onChange,
}: {
  query: string
  onChange: (next: string) => void
}) => {
  const inputId = useId()
  return (
    <div className="p-4 border-b border-border">
      <div className="relative">
        <Search
          aria-hidden
          className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2"
        />
        <Input
          id={inputId}
          type="search"
          data-testid="templates-search"
          value={query}
          onChange={(event) => onChange(event.target.value)}
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
            onClick={() => onChange("")}
            className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

const TemplatesBrowserInner = ({
  allTemplates,
}: {
  allTemplates: ReadonlyArray<Template>
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()

  const [activeTypes, setActiveTypes] = useState<string[]>(() =>
    toFilterList(search?.getAll("type"), Object.keys(CATEGORY_LABELS)),
  )
  const [activeFrameworks, setActiveFrameworks] = useState<string[]>(() =>
    toFilterList(
      search?.getAll("framework"),
      Object.keys(FRAMEWORK_LABELS),
    ),
  )
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLowerCase() || null

  // Re-sync local state when the URL changes (e.g. back/forward).
  // This is what makes the previous-selection and prior/next
  // navigation work: the URL is the source of truth and we mirror
  // it into local state on every change.
  useEffect(() => {
    const nextTypes = toFilterList(
      search?.getAll("type"),
      Object.keys(CATEGORY_LABELS),
    )
    const nextFrameworks = toFilterList(
      search?.getAll("framework"),
      Object.keys(FRAMEWORK_LABELS),
    )
    const sameTypes =
      nextTypes.length === activeTypes.length &&
      nextTypes.every((v, i) => v === activeTypes[i])
    const sameFrameworks =
      nextFrameworks.length === activeFrameworks.length &&
      nextFrameworks.every((v, i) => v === activeFrameworks[i])
    if (!sameTypes) setActiveTypes(nextTypes)
    if (!sameFrameworks) setActiveFrameworks(nextFrameworks)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const toggleFilter = (
    key: "type" | "framework",
    value: string,
  ): void => {
    const current = key === "type" ? activeTypes : activeFrameworks
    const set = new Set(current)
    if (set.has(value)) {
      set.delete(value)
    } else {
      set.add(value)
    }
    const next = Array.from(set)
    const params = new URLSearchParams(search?.toString() ?? "")
    // Drop existing occurrences of this key and re-add in order.
    const preserved: string[] = []
    for (const [k, v] of params.entries()) {
      if (k === key) continue
      preserved.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    }
    const nextParams = new URLSearchParams()
    // Order: type first, then framework, then anything else.
    const otherKey = key === "type" ? "framework" : "type"
    for (const v of (key === "type" ? next : activeFrameworks)) {
      nextParams.append("type", v)
    }
    for (const v of (key === "framework" ? next : activeTypes)) {
      nextParams.append("framework", v)
    }
    // Preserve any unrelated query params.
    if (preserved.length > 0) {
      const preservedUrl = new URLSearchParams(preserved.join("&"))
      for (const [k, v] of preservedUrl.entries()) {
        if (k === "type" || k === "framework") continue
        nextParams.append(k, v)
      }
    }
    const qs = nextParams.toString()
    const url = qs.length > 0 ? `${pathname}?${qs}` : pathname
    router.replace(url, { scroll: false })
  }

  const typeSet = useMemo(() => new Set(activeTypes), [activeTypes])

  const filtered = useMemo(
    () =>
      allTemplates.filter((template) =>
        matchesTemplate(
          template,
          typeSet,
          activeFrameworks,
          normalizedQuery,
        ),
      ),
    [allTemplates, typeSet, activeFrameworks, normalizedQuery],
  )

  return (
    <div className="border-b border-border">
      <div className="grid grid-cols-2 divide-y divide-border border-border lg:grid-cols-[18rem_minmax(0,1fr)] lg:divide-x lg:divide-y-0">
        <div className="p-6 md:p-8 lg:p-10">
          <FiltersSidebar
            templates={allTemplates}
            activeTypes={activeTypes}
            activeFrameworks={activeFrameworks}
            onToggle={toggleFilter}
          />
        </div>
        <div className="flex min-w-0 flex-col">
          <SearchBox query={query} onChange={setQuery} />
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
      </div>
    </div>
  )
}

export const TemplatesBrowser = ({
  allTemplates,
}: {
  allTemplates: ReadonlyArray<Template>
}) => {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {/* Skeleton fallback: an empty shell that mirrors the
              final layout so the initial paint does not flash
              unstyled HTML. */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border border-border bg-muted/40 h-64"
              aria-hidden
            />
          ))}
        </div>
      }
    >
      <TemplatesBrowserInner allTemplates={allTemplates} />
    </Suspense>
  )
}

void Link
void Badge
