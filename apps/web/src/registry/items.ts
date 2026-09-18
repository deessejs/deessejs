import { copyCommand } from "./items/copy-command"
import { flickeringGrid } from "./items/flickering-grid"

/**
 * The catalogue served by `GET /r/registry.json`. Each item
 * is the JSON shape defined by
 * https://ui.shadcn.com/docs/registry/registry-item-json.
 *
 * V1 ships two single-file items (`registry:ui`). V2 expands to
 * multi-file `registry:block` items and auto-generation from
 * the marketing source tree.
 */
export const ITEMS = {
  components: {
    "copy-command": copyCommand,
    "flickering-grid": flickeringGrid,
  },
  blocks: {},
} as const