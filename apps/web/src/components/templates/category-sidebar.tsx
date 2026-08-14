import Link from "next/link"

import type { TemplateV1 as Template } from "@workspace/contracts/v1"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Sidebar shown on /templates with two multi-select filter
 * groups: Type (?type=) and Framework (?framework=). Mirrors the
 * Vercel `/templates` shape where each group is an
 * independent filter and the URL preserves both.
 */

const CATEGORIES: ReadonlyArray<{ slug: string; label: string }> = [
  { slug: "saas", label: "SaaS starters" },
  { slug: "ai", label: "AI" },
  { slug: "landing", label: "Landing pages" },
] as const

/**
 * Frameworks exposed as filter chips. Drawn from the curated
 * labels in `packages/api/src/templates.ts` (technical labels
 * only — thematic ones like "auth" / "marketing" are excluded).
 *
 * A framework is hidden from the sidebar when zero templates
 * in the registry carry it, computed at render time.
 */
const FRAMEWORKS: ReadonlyArray<{ slug: string; label: string }> = [
  { slug: "nextjs", label: "Next.js" },
  { slug: "astro", label: "Astro" },
  { slug: "tailwind", label: "Tailwind CSS" },
  { slug: "shadcn", label: "shadcn/ui" },
  { slug: "drizzle", label: "Drizzle" },
  { slug: "postgres", label: "Postgres" },
  { slug: "stripe", label: "Stripe" },
  { slug: "tanstack-table", label: "TanStack Table" },
  { slug: "openai", label: "OpenAI" },
  { slug: "react-hook-form", label: "React Hook Form" },
] as const

export type CategorySidebarProps = {
  templates: Template[]
  activeTypes: ReadonlyArray<string>
  activeFrameworks: ReadonlyArray<string>
  className?: string
}

/**
 * Build a `/templates?<key>=A&<key>=B` URL toggling `target`
 * in/out of `current` for the given query key. The "clear all
 * filters" link passes `null` for target and returns `/templates`
 * with both keys dropped.
 *
 * Multi-value handling follows the Vercel convention — each value
 * is its own query key (not `?type=a,b`), which Next.js parses
 * as `string[]` on the server.
 */
const buildHref = (
  current: ReadonlyArray<string>,
  target: string | null,
  paramKey: "type" | "framework",
  otherKey: "type" | "framework",
  otherValues: ReadonlyArray<string>,
): string => {
  const params = new URLSearchParams()
  for (const v of otherValues) {
    params.append(otherKey, v)
  }
  if (target === null) {
    if (params.toString().length === 0) return "/templates"
    return `/templates?${params.toString()}`
  }
  const set = new Set(current)
  if (set.has(target)) {
    set.delete(target)
  } else {
    set.add(target)
  }
  for (const v of set) {
    params.append(paramKey, v)
  }
  if (params.toString().length === 0) return "/templates"
  return `/templates?${params.toString()}`
}

type FilterEntry = { slug: string; label: string }
type FilterGroupProps = {
  title: string
  entries: ReadonlyArray<FilterEntry>
  /** Active values for this group's filter key. */
  activeValues: ReadonlyArray<string>
  /** Other filter group's active values (preserved on toggle). */
  otherActiveValues: ReadonlyArray<string>
  /** Query key for this group ("type" or "framework").
   * Named `paramKey` to avoid collision with React's reserved `key` prop. */
  paramKey: "type" | "framework"
  /** Other group's query key. */
  otherKey: "type" | "framework"
  /** Count templates matching this entry (group-specific). */
  countFor: (slug: string) => number
}

/**
 * One multi-select checkbox group inside the sidebar.
 */
const FilterGroup = ({
  title,
  entries,
  activeValues,
  otherActiveValues,
  paramKey,
  otherKey,
  countFor,
}: FilterGroupProps) => {
  const activeSet = new Set(activeValues)
  return (
    <div>
      <h3 className="text-label-13 mb-3 font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <ul className="flex flex-col gap-1">
        {entries.map((entry) => {
          const isActive = activeSet.has(entry.slug)
          const href = buildHref(
            activeValues,
            entry.slug,
            paramKey,
            otherKey,
            otherActiveValues,
          )
          const count = countFor(entry.slug)
          return (
            <li key={entry.slug}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "text-label-13 flex w-full items-center justify-between gap-3 rounded-md px-3 py-1.5 text-left transition-colors hover:bg-accent hover:text-foreground",
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
                <span className="text-copy-13 text-muted-foreground/70">
                  {count}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export const CategorySidebar = ({
  templates,
  activeTypes,
  activeFrameworks,
  className,
}: CategorySidebarProps) => {
  // Hide framework entries that no template carries.
  const visibleFrameworks = FRAMEWORKS.filter(({ slug }) =>
    templates.some((t) => t.labels.includes(slug)),
  )
  const totalShown = templates.length
  return (
    <aside className={cn("w-full lg:sticky lg:top-20 lg:self-start", className)}>
      <div className="flex flex-col gap-6">
        <FilterGroup
          title="Type"
          entries={CATEGORIES}
          activeValues={activeTypes}
          otherActiveValues={activeFrameworks}
          paramKey="type"
          otherKey="framework"
          countFor={(slug) =>
            templates.filter((t) => t.category === slug).length
          }
        />
        <FilterGroup
          title="Framework"
          entries={visibleFrameworks}
          activeValues={activeFrameworks}
          otherActiveValues={activeTypes}
          paramKey="framework"
          otherKey="type"
          countFor={(slug) =>
            templates.filter((t) => t.labels.includes(slug)).length
          }
        />
        <p className="text-copy-13 text-muted-foreground/70">
          {totalShown} template{totalShown === 1 ? "" : "s"} in catalog
        </p>
      </div>
    </aside>
  )
}