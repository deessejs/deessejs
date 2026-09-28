import { ITEMS } from "./items"

/**
 * The catalogue index served by `GET /r/registry.json`. Derived
 * from `ITEMS` so the index can never advertise items that
 * haven't been registered as installable registry sources —
 * adding a new registry item is a one-step change in
 * `apps/web/src/registry/items.ts`, and the catalogue picks it
 * up automatically.
 *
 * The `items` array follows the shadcn `registry.json` schema:
 * each entry is a full RegistryItem object (`name`, `type`,
 * `title`, `description`, `dependencies`, `registryDependencies`,
 * `files`), so a consumer running `npx shadcn add @deessejs/<name>`
 * against this index can resolve the item without ever hitting a
 * leaf `/r/<name>.json` route. The leaf route exists for direct
 * `view` / raw fetch.
 *
 * Schema: https://ui.shadcn.com/docs/registry/registry-json
 */
export const CATALOGUE = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "deessejs",
  homepage: "https://deessejs.com",
  items: [
    ...Object.values(ITEMS.components),
    ...Object.values(ITEMS.blocks),
  ],
} as const
