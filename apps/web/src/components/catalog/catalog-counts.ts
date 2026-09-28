/**
 * Catalog chrome helper: counts.
 *
 * Builds the `Record<CategoryId, number>` sidebar badges by
 * walking an item array and tallying items per category. The
 * `getCategoryId` callback reads the category identifier off each
 * item so this helper works for both `CatalogueComponent` (whose
 * `category` field is the literal `CategoryId`) and `CatalogueBlock`
 * (same shape, different id type).
 *
 * Server-only: the input array is fully resolved at build time
 * (these catalogues are static TS literals), so the helper is a
 * pure data-shaping function with no React or runtime deps. It
 * can be called from a Server Component (used by both
 * `(product)/components/page.tsx` and
 * `(product)/blocks/page.tsx`) or from a Client Component
 * (used by the category browser, where the counts need to be
 * recomputed reactively when `pinned` changes).
 *
 * Pre-refactor note: the `/blocks` index was rendering `counts = 1`
 * per category in `BlocksBrowser` (`useMemo`), which made the
 * sidebar lie ("1" for `hero` even though 4 blocks live there).
 * Centralising the calculation here lets both surfaces share the
 * same arithmetic and fixes the blocks regression in passing.
 */
export function calculateCatalogCounts<Id extends string, Item>(
  items: ReadonlyArray<Item>,
  getCategoryId: (item: Item) => Id,
): Record<Id, number> {
  const counts = {} as Record<Id, number>
  for (const item of items) {
    const id = getCategoryId(item)
    counts[id] = (counts[id] ?? 0) + 1
  }
  return counts
}
