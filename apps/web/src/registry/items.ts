/**
 * The catalogue served by `GET /r/registry.json`. Each item
 * is the JSON shape defined by
 * https://ui.shadcn.com/docs/registry/registry-item-json.
 *
 * V2 ships 15 `registry:ui` items split across 3 categories
 * (button, input, badge). The blocks map stays empty until
 * V3 lifts inline sections from the marketing pages.
 */
import { badge } from "./items/badge"
import { badgeDot } from "./items/badge-dot"
import { badgeIcon } from "./items/badge-icon"
import { badgeNumeric } from "./items/badge-numeric"
import { badgeRemovable } from "./items/badge-removable"
import { button } from "./items/button"
import { buttonGroup } from "./items/button-group"
import { iconButton } from "./items/icon-button"
import { input } from "./items/input"
import { inputOtp } from "./items/input-otp"
import { inputSearch } from "./items/input-search"
import { inputTags } from "./items/input-tags"
import { loadingButton } from "./items/loading-button"
import { splitButton } from "./items/split-button"
import { textarea } from "./items/textarea"

export const ITEMS = {
  components: {
    // button (5)
    button,
    "button-group": buttonGroup,
    "split-button": splitButton,
    "icon-button": iconButton,
    "loading-button": loadingButton,
    // input (5)
    input,
    "input-search": inputSearch,
    "input-otp": inputOtp,
    "input-tags": inputTags,
    textarea,
    // badge (5)
    badge,
    "badge-dot": badgeDot,
    "badge-removable": badgeRemovable,
    "badge-icon": badgeIcon,
    "badge-numeric": badgeNumeric,
  },
  blocks: {},
} as const