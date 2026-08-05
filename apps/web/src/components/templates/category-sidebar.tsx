import Link from "next/link"

import type { Template } from "@/lib/templates-api"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Categories shown in the templates sidebar as multi-select
 * checkboxes, matching the Vercel `/templates?type=X&type=Y` shape.
 *
 * Sourced from the union of `category` values present in the
 * `TemplateV1` contract. "All templates" is a separate clear-filter
 * affordance rather than a checkbox — it deselects everything and
 * points to `/templates` without a query string.
 */
const CATEGORIES: ReadonlyArray<{
  slug: string
  label: string
}> = [
  { slug: "saas", label: "SaaS starters" },
  { slug: "ai", label: "AI" },
  { slug: "landing", label: "Landing pages" },
] as const

export type CategorySidebarProps = {
  templates: Template[]
  /** Currently active types (multi-select). Empty array = no filter. */
  activeTypes: ReadonlyArray<string>
  className?: string
}

/**
 * Build the URL for a given checkbox state — toggling `target`
 * in/out of the current `activeTypes` set.
 *
 * - If `target` is already in `activeTypes`, remove it.
 * - Otherwise add it.
 * - If the resulting set is empty, drop the query string entirely
 *   so the URL stays clean.
 * - The "All templates" row passes `null` to clear the filter.
 *
 * Multiple `?type=` keys (not `?type=a,b`) follow the Vercel
 * convention — each value is its own query key, which Next.js
 * parses as `string | string[]` on the server.
 */
const buildHref = (
  activeTypes: ReadonlyArray<string>,
  target: string | null,
): string => {
  if (target === null) return "/templates"
  const set = new Set(activeTypes)
  if (set.has(target)) {
    set.delete(target)
  } else {
    set.add(target)
  }
  if (set.size === 0) return "/templates"
  const params = new URLSearchParams()
  for (const slug of set) {
    params.append("type", slug)
  }
  return `/templates?${params.toString()}`
}

const templatesByCategory = (templates: Template[], slug: string) =>
  templates.filter((t) => t.category === slug).length

export const CategorySidebar = ({
  templates,
  activeTypes,
  className,
}: CategorySidebarProps) => {
  const activeSet = new Set(activeTypes)
  return (
    <aside className={cn("w-full lg:sticky lg:top-20 lg:self-start", className)}>
      <div>
        <h2 className="text-label-13 mb-3 font-semibold tracking-tight text-foreground">
          Categories
        </h2>
        <ul className="flex flex-col gap-1">
          <li>
            <Link
              href="/templates"
              aria-current={activeTypes.length === 0 ? "page" : undefined}
              className={cn(
                "text-label-13 flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left transition-colors hover:bg-accent hover:text-foreground",
                activeTypes.length === 0
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <span>All templates</span>
              <span className="text-copy-13 text-muted-foreground/70">
                {templates.length}
              </span>
            </Link>
          </li>
          {CATEGORIES.map((category) => {
            const isActive = activeSet.has(category.slug)
            const href = buildHref(activeTypes, category.slug)
            const count = templatesByCategory(templates, category.slug)
            return (
              <li key={category.slug}>
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
                    {category.label}
                  </span>
                  <span className="text-copy-13 text-muted-foreground/70">
                    {count}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
        <p className="text-copy-13 text-muted-foreground/70 mt-6">
          {templates.length} template{templates.length === 1 ? "" : "s"} shown
        </p>
      </div>
    </aside>
  )
}