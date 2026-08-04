import Link from "next/link"

import type { Template } from "@/lib/templates-api"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Categories shown in the templates sidebar.
 *
 * Sourced from the union of `category` values present in the
 * `TemplateV1` contract (see `packages/contracts/src/v1/templates.ts`).
 * Only categories that actually have templates in the registry are
 * listed — empty buckets are hidden until they ship.
 */
const CATEGORIES: ReadonlyArray<{
  slug: string
  label: string
}> = [
  { slug: "all", label: "All templates" },
  { slug: "saas", label: "SaaS starters" },
  { slug: "ai", label: "AI" },
  { slug: "landing", label: "Landing pages" },
] as const

export type CategorySidebarProps = {
  templates: Template[]
  /** Currently active category, used to mark the matching link. */
  activeCategory: string
  className?: string
}

/**
 * Sidebar that lists template categories as links to `/templates?category=<slug>`.
 * The "all" entry points to `/templates` without a query string.
 */
export const CategorySidebar = ({
  templates,
  activeCategory,
  className,
}: CategorySidebarProps) => {
  return (
    <aside className={cn("w-full lg:sticky lg:top-20 lg:self-start", className)}>
      <div>
        <h2 className="text-label-13 mb-3 font-semibold tracking-tight text-foreground">
          Categories
        </h2>
        <ul className="flex flex-col gap-1">
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category.slug
            const href = category.slug === "all" ? "/templates" : `/templates?category=${category.slug}`
            const count = templatesByCategory(templates, category.slug)
            return (
              <li key={category.slug}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "text-label-13 flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left transition-colors hover:bg-accent hover:text-foreground",
                    isActive
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <span>{category.label}</span>
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

const templatesByCategory = (templates: Template[], slug: string) => {
  if (slug === "all") return templates.length
  return templates.filter((t) => t.category === slug).length
}