import { ITEMS } from "./items"

/**
 * Returns `true` if a given slug is registered as an installable
 * registry item. Used by the marketing pages to gate install
 * commands and code snippets so we don't promise visitors a
 * working `npx shadcn add <slug>` for items that haven't been
 * wired into `@workspace/ui` yet.
 *
 * Source of truth: `apps/web/src/registry/items.ts`. Adding a
 * new item there automatically flips its `isShipped()` to `true`.
 */
export function isShipped(slug: string): boolean {
  return (
    Object.hasOwn(ITEMS.components, slug) ||
    Object.hasOwn(ITEMS.blocks, slug)
  )
}
