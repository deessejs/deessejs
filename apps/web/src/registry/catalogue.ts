/**
 * The catalogue index served by `GET /r/registry.json`. Hand-
 * maintained for V1 (two items). V2 auto-generates from the
 * `ITEMS` map so the index never drifts.
 *
 * Schema: https://ui.shadcn.com/docs/registry/registry-json
 */
export const CATALOGUE = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "deessejs",
  homepage: "https://deessejs.com",
  items: [
    {
      path: "/r/components/copy-command.json",
      type: "registry:ui",
    },
    {
      path: "/r/components/flickering-grid.json",
      type: "registry:ui",
    },
  ],
} as const