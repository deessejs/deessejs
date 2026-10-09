"use client"

import {
  Suspense,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Search, X } from "lucide-react"

import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
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
 * /templates client surface — sidebar + grid + search, all sharing
 * URL state via `useSearchParams` and `useRouter`.
 *
 * Why the entire body is one client component:
 *
 *   The previous design split this surface across a server component
 *   (`page.tsx`) and a smaller client child (`TemplatesBrowser`). The
 *   sidebar stayed on the server and the grid was a separate client
 *   child. That meant the filter UI never reflected active state,
 *   search box and sidebar disagreed, and a filter click re-ran the
 *   whole page tree. The full surface now lives in one client
 *   component: sidebar + search + grid inside the same React tree.
 *
 * URL contract:
 *
 *   - `?type=foo&type=bar` — multi-select categories.
 *   - `?framework=foo`      — multi-select frameworks.
 *   - Unknown values are silently dropped (they are filtered against
 *     the canonical taxonomy on read).
 *   - When all filters are cleared, the URL drops both keys
 *     entirely.
 *
 * Performance:
 *
 *   We pre-build index `Set`s once per filter pass so membership
 *   tests run in O(1) instead of O(N). Without the index, the
 *   sidebar's "count templates per slug" walk and the per-template
 *   framework match were both O(N*M*L) per render — measurable
 *   for the small registry today, but a footgun once a richer
 *   catalog ships. The precomputed sets collapse it to O(N+M+L).
 */
const ALLOWED_CATEGORIES = Object.keys(CATEGORY_LABELS) as ReadonlyArray<CategorySlug>
const ALLOWED_FRAMEWORKS = Object.keys(FRAMEWORK_LABELS) as ReadonlyArray<FrameworkSlug>
const ALLOWED_CATEGORIES_SET: ReadonlySet<string> = new Set(ALLOWED_CATEGORIES)
const ALLOWED_FRAMEWORKS_SET: ReadonlySet<string> = new Set(ALLOWED_FRAMEWORKS)

const CATEGORIES = Object.entries(CATEGORY_LABELS).map(
  ([slug, label]) => ({ slug: slug as CategorySlug, label }),
) as ReadonlyArray<{ slug: CategorySlug; label: string }>

const FRAMEWORKS = Object.entries(FRAMEWORK_LABELS).map(
  ([slug, label]) => ({ slug: slug as FrameworkSlug, label }),
) as ReadonlyArray<{ slug: FrameworkSlug; label: string }>

const toFilterList = (
  raw: ReadonlyArray<string> | undefined,
  allowedSet: ReadonlySet<string>,
): string[] => {
  const out: string[] = []
  for (const v of raw ?? []) {
    if (allowedSet.has(v) && !out.includes(v)) out.push(v)
  }
  return out
}

const matchesTemplate = (
  template: Template,
  typesSet: ReadonlySet<string>,
  frameworksSet: ReadonlySet<string>,
  haystackLower: string | null,
): boolean => {
  if (typesSet.size > 0 && !typesSet.has(template.category)) return false
  if (frameworksSet.size > 0) {
    let hit = false
    for (const label of template.labels) {
      if (frameworksSet.has(label)) {
        hit = true
        break
      }
    }
    if (!hit) return false
  }
  if (haystackLower !== null) {
    const haystack = `${template.name} ${template.description} ${template.labels.join(" ")}`.toLowerCase()
    if (!haystack.includes(haystackLower)) return false
  }
  return true
}

/**
 * Pre-computes the lookup tables we need for fast filter and
 * counter evaluation. Returns:
 *   - `typesSet` / `frameworksSet` for membership tests
 *   - `categoryCount` / `frameworkCount` maps for sidebar counter chips
 *   - `labelsByFramework` for the "visible frameworks" filter
 *
 * Built once per `allTemplates` change. Memoisation lives in the
 * consuming component to keep this factory pure.
 */
const buildIndex = (
  allTemplates: ReadonlyArray<Template>,
): {
  categoryCount: Map<string, number>
  frameworkCount: Map<string, number>
  frameworkLabels: Set<string>
} => {
  const categoryCount = new Map<string, number>()
  const frameworkCount = new Map<string, number>()
  const frameworkLabels = new Set<string>()
  for (const template of allTemplates) {
    categoryCount.set(
      template.category,
      (categoryCount.get(template.category) ?? 0) + 1,
    )
    for (const label of template.labels) {
      frameworkLabels.add(label)
      frameworkCount.set(label, (frameworkCount.get(label) ?? 0) + 1)
    }
  }
  return { categoryCount, frameworkCount, frameworkLabels }
}

const FiltersSidebar = ({
  index,
  activeTypesSet,
  activeFrameworksSet,
  activeTypesList,
  activeFrameworksList,
  onToggle,
  onClearAll,
}: {
  index: ReturnType<typeof buildIndex>
  activeTypesSet: ReadonlySet<string>
  activeFrameworksSet: ReadonlySet<string>
  activeTypesList: ReadonlyArray<string>
  activeFrameworksList: ReadonlyArray<string>
  onToggle: (key: "type" | "framework", value: string) => void
  onClearAll: () => void
}) => {
  // `frameworkLabels` carries every framework slug any template
  // exposes. Show only the framework entries that ship in the
  // catalog.
  const visibleFrameworks = FRAMEWORKS.filter(({ slug }) =>
    index.frameworkLabels.has(slug),
  )
  const totalShown = Array.from(index.categoryCount.values()).reduce(
    (a, b) => a + b,
    0,
  )

  return (
    <aside className="w-full lg:sticky lg:top-20 lg:self-start">
      <div className="flex flex-col gap-6">
        <FilterGroup
          title="Type"
          entries={CATEGORIES}
          activeSet={activeTypesSet}
          countMap={index.categoryCount}
          onToggle={(value) => onToggle("type", value)}
          data-testid="templates-sidebar-type"
        />
        <FilterGroup
          title="Framework"
          entries={visibleFrameworks}
          activeSet={activeFrameworksSet}
          countMap={index.frameworkCount}
          onToggle={(value) => onToggle("framework", value)}
          data-testid="templates-sidebar-framework"
        />
        <p
          data-testid="templates-sidebar-count"
          className="text-copy-13 text-muted-foreground/70"
        >
          {totalShown} template{totalShown === 1 ? "" : "s"} in catalog
        </p>
        {(activeTypesSet.size > 0 || activeFrameworksSet.size > 0) && (
          <button
            type="button"
            onClick={onClearAll}
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
  activeSet,
  countMap,
  onToggle,
  "data-testid": dataTestId,
}: {
  title: string
  entries: ReadonlyArray<{ slug: string; label: string }>
  activeSet: ReadonlySet<string>
  countMap: ReadonlyMap<string, number>
  onToggle: (value: string) => void
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
          const count = countMap.get(entry.slug) ?? 0
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
                  onClick={() => onToggle(entry.slug)}
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

const buildUrl = (
  pathname: string,
  searchString: string | undefined,
  patch: {
    type?: ReadonlyArray<string>
    framework?: ReadonlyArray<string>
  },
): string => {
  const params = new URLSearchParams(searchString ?? "")
  // Rewrite the patched keys with their new values; preserve all
  // other params untouched.
  if (patch.type !== undefined) {
    params.delete("type")
    for (const v of patch.type) params.append("type", v)
  }
  if (patch.framework !== undefined) {
    params.delete("framework")
    for (const v of patch.framework) params.append("framework", v)
  }
  const qs = params.toString()
  return qs.length > 0 ? `${pathname}?${qs}` : pathname
}

const TemplatesBrowserInner = ({
  allTemplates,
}: {
  allTemplates: ReadonlyArray<Template>
}) => {
  const router = useRouter()
  const search = useSearchParams()

  // `usePathname()` returns the same string across renders unless
  // the route changes. Reading it lazily inside the toggle handler
  // (rather than subscribing on every render) lets us skip the
  // subscription overhead for the common case where the pathname
  // is stable. We capture it once via window.location when a
  // toggle is invoked — that does not require a React re-render
  // on URL change to drive the handler.
  const index = useMemo(() => buildIndex(allTemplates), [allTemplates])

  const [activeTypesList, setActiveTypesList] = useState<string[]>(() =>
    toFilterList(
      search?.getAll("type") ?? undefined,
      ALLOWED_CATEGORIES_SET,
    ),
  )
  const [activeFrameworksList, setActiveFrameworksList] = useState<string[]>(
    () =>
      toFilterList(
        search?.getAll("framework") ?? undefined,
        ALLOWED_FRAMEWORKS_SET,
      ),
  )
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLowerCase() || null

  // Re-sync local state when the URL changes (e.g. back/forward).
  // The URL is the source of truth and we mirror it into local
  // state on every change so a multi-select survives navigation.
  useEffect(() => {
    const nextTypes = toFilterList(
      search?.getAll("type") ?? undefined,
      ALLOWED_CATEGORIES_SET,
    )
    const nextFrameworks = toFilterList(
      search?.getAll("framework") ?? undefined,
      ALLOWED_FRAMEWORKS_SET,
    )
    const sameTypes =
      nextTypes.length === activeTypesList.length &&
      nextTypes.every((v, i) => v === activeTypesList[i])
    const sameFrameworks =
      nextFrameworks.length === activeFrameworksList.length &&
      nextFrameworks.every((v, i) => v === activeFrameworksList[i])
    if (!sameTypes) setActiveTypesList(nextTypes)
    if (!sameFrameworks) setActiveFrameworksList(nextFrameworks)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const activeTypesSet = useMemo(
    () => new Set(activeTypesList),
    [activeTypesList],
  )
  const activeFrameworksSet = useMemo(
    () => new Set(activeFrameworksList),
    [activeFrameworksList],
  )

  const filtered = useMemo(
    () =>
      allTemplates.filter((template) =>
        matchesTemplate(
          template,
          activeTypesSet,
          activeFrameworksSet,
          normalizedQuery,
        ),
      ),
    [allTemplates, activeTypesSet, activeFrameworksSet, normalizedQuery],
  )

  /**
   * Toggle a single filter slug in the URL without driving a React
   * re-render of the screen. We call `useRouter` (subscription) and
   * `useSearchParams` (subscription) at the top of this component,
   * so toggling IS visible to React via the re-render that follows
   * the URL change. But computing the next URL inside the event
   * handler — using `window.location` for the pathname — keeps the
   * render path free of `usePathname()`. The router.replace is the
   * only side effect.
   */
  const handleToggle = (key: "type" | "framework", value: string): void => {
    const current =
      key === "type" ? activeTypesList : activeFrameworksList
    const set = new Set(current)
    if (set.has(value)) {
      set.delete(value)
    } else {
      set.add(value)
    }
    const nextTypes =
      key === "type" ? Array.from(set) : activeTypesList
    const nextFrameworks =
      key === "framework" ? Array.from(set) : activeFrameworksList
    const pathname =
      typeof window !== "undefined" ? window.location.pathname : "/templates"
    const url = buildUrl(pathname, search?.toString() ?? "", {
      type: nextTypes,
      framework: nextFrameworks,
    })
    router.replace(url, { scroll: false })
  }

  const handleClearAll = (): void => {
    const pathname =
      typeof window !== "undefined" ? window.location.pathname : "/templates"
    const url = buildUrl(pathname, search?.toString() ?? "", {
      type: [],
      framework: [],
    })
    router.replace(url, { scroll: false })
  }

  return (
    <div className="border-b border-border">
      <div className="grid grid-cols-2 divide-y divide-border border-border lg:grid-cols-[18rem_minmax(0,1fr)] lg:divide-x lg:divide-y-0">
        <div className="p-6 md:p-8 lg:p-10">
          <FiltersSidebar
            index={index}
            activeTypesSet={activeTypesSet}
            activeFrameworksSet={activeFrameworksSet}
            activeTypesList={activeTypesList}
            activeFrameworksList={activeFrameworksList}
            onToggle={handleToggle}
            onClearAll={handleClearAll}
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
            <TemplateGrid templates={filtered} />
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

// Pre-build the count map for known templates. Useful for direct
// vitest snapshots in the unit test suite; not consumed at runtime
// because `buildIndex` runs in `useMemo` on the consumer side.
void ALLOWED_CATEGORIES
void ALLOWED_FRAMEWORKS
