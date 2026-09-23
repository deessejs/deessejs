/**
 * The catalogue served by GET /r/registry.json. Each item is
 * the JSON shape defined by
 * https://ui.shadcn.com/docs/registry/registry-item-json.
 *
 * V2 ships the 3 components that have real source files in
 * packages/ui/src/components/: button, input, badge. The other
 * 12 components in components-list.ts (button-group,
 * split-button, icon-button, loading-button, input-search,
 * input-otp, input-tags, textarea, badge-dot, badge-removable,
 * badge-icon, badge-numeric) are documented in the catalogue
 * but not yet shipped as registry items. They will be added
 * as their primitives land in @workspace/ui.
 */
import { badge } from "./items/badge"
import { button } from "./items/button"
import { input } from "./items/input"

export const ITEMS = {
  components: {
    button,
    input,
    badge,
  },
  blocks: {},
} as const
