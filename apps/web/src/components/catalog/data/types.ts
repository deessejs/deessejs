/**
 * Shared catalog types.
 *
 * The catalog surface (apps/web/src/components/catalog/) renders
 * two parallel registries:
 *   1. /components - 15 primitives, 3 categories
 *   2. /blocks     - 21 section blocks, 8 categories
 *
 * Each tree defines its own slug and category unions. The shared
 * generic is parametrised on both, so neither tree is forced to
 * give up its own data shape.
 */

export type CatalogTier = "free" | "pro"

/**
 * Category metadata. Identical between trees except for the
 * blockNames field, which only the blocks tree uses (a
 * comma-separated list of block slugs rendered in the
 * placeholder card). Optional on the shared type to avoid
 * forcing the components tree to add an unused field.
 */
export type CatalogCategory = {
  id: string
  slug: string
  name: string
  description: string
  blockNames?: string
}

/**
 * One catalog entry - a component or a block. Both trees
 * extend this with their own discriminated unions (see
 * catalogue-components.ts and catalogue-blocks.ts).
 *
 * The two type parameters are independent. Each tree declares
 * its own literal unions, so the exhaustiveness check at the
 * end of the icon map stays tight (see components-icons.ts,
 * blocks-icons.ts).
 */
export type CatalogItem<
  TSlug extends string = string,
  TCategoryId extends string = string,
> = {
  slug: TSlug
  name: string
  description: string
  category: TCategoryId
  tier: CatalogTier
}

export type CatalogueList<
  TItem extends CatalogItem<string, string>,
> = ReadonlyArray<TItem>
