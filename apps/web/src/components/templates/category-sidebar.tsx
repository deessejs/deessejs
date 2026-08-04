import type { Template } from "@/lib/templates-api"

/**
 * Categories shown in the templates sidebar.
 *
 * Currently derived from the hard-coded templates in
 * `packages/api/src/templates.ts` plus a few dummy entries to show
 * the "full list" shape the design is heading toward. In V1, this
 * list is **purely visual** — items render but are not clickable
 * yet. Click-to-filter wiring lands with the categories API (V1.1).
 */
const CATEGORIES: ReadonlyArray<{
  slug: string
  label: string
  count: number
}> = [
  { slug: "all", label: "All templates", count: 3 },
  { slug: "saas", label: "SaaS starters", count: 1 },
  { slug: "ai", label: "AI", count: 1 },
  { slug: "landing", label: "Landing pages", count: 1 },
  { slug: "ecommerce", label: "E-commerce", count: 0 },
  { slug: "mobile", label: "Mobile apps", count: 0 },
  { slug: "internal-tools", label: "Internal tools", count: 0 },
  { slug: "apis", label: "APIs", count: 0 },
] as const

export type CategorySidebarProps = {
  templates: Template[]
  className?: string
}

/**
 * Sidebar that lists template categories. Currently a static visual
 * surface — counts are hard-coded, items are not clickable. The shape
 * is forward-compatible: when the categories API lands, this component
 * swaps the constant for a `fetch` and the links become `<a href>`.
 */
export const CategorySidebar = ({
  templates,
  className,
}: CategorySidebarProps) => {
  return (
    <aside className={cn("w-full lg:sticky lg:top-20 lg:self-start", className)}>
      <div>
        <h2 className="text-label-14 mb-4 font-semibold tracking-tight text-foreground">
          Categories
        </h2>
        <ul className="flex flex-col gap-1">
          {CATEGORIES.map((category) => (
            <li key={category.slug}>
              <button
                type="button"
                disabled
                aria-label={`Filter by ${category.label} (coming soon)`}
                className="text-label-14 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-100"
              >
                <span>{category.label}</span>
                <span className="text-copy-13 text-muted-foreground/70">
                  {category.count}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="text-copy-13 text-muted-foreground/70 mt-6">
          {templates.length} template{templates.length === 1 ? "" : "s"} shown
          · filter coming soon
        </p>
      </div>
    </aside>
  )
}