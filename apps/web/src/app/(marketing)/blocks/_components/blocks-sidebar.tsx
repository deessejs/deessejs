"use client"

import { useId } from "react"

import { Checkbox } from "@workspace/ui/components/checkbox"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type {
  BlockCategoryId,
  BlockCategory,
} from "./block-categories"

type Props = {
  categories: ReadonlyArray<BlockCategory>
  active: Set<BlockCategoryId>
  counts: Record<BlockCategoryId, number>
  onToggle: (id: BlockCategoryId) => void
  onReset: () => void
}

/**
 * Sidebar with one `<Checkbox>` per category for the `/blocks`
 * index. Dumb component: state lives in `<BlocksBrowser>`.
 *
 * Same shape as `CatalogueSidebar` in the components registry.
 * Sticky on desktop (`lg:sticky lg:top-20 lg:self-start`).
 */
export function BlocksSidebar({
  categories,
  active,
  counts,
  onToggle,
  onReset,
}: Props) {
  const baseId = useId()
  const showReset = active.size < categories.length

  return (
    <aside className="flex w-full flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
      <h2 className="text-label-13 uppercase tracking-wider text-muted-foreground">
        Categories
      </h2>
      <ul className="flex flex-col gap-1">
        {categories.map((category) => {
          const id = `${baseId}-${category.id}`
          const isActive = active.has(category.id)
          return (
            <li key={category.id}>
              <label
                htmlFor={id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md border border-border bg-background px-3 py-2 transition-colors",
                  isActive ? "bg-accent/30" : "hover:bg-accent/20",
                )}
              >
                <Checkbox
                  id={id}
                  checked={isActive}
                  onCheckedChange={() => onToggle(category.id)}
                  aria-label={`Show ${category.name} blocks`}
                />
                <span className="text-label-14 font-medium text-foreground flex-1">
                  {category.name}
                </span>
                <span className="text-label-13 text-muted-foreground tabular-nums">
                  {counts[category.id]}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      {showReset ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="self-start"
        >
          Show all categories
        </Button>
      ) : null}
    </aside>
  )
}