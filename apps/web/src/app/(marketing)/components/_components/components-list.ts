/**
 * Component catalogue for /components/[category]/[component].
 *
 * V2 ships 15 components across 3 categories (button, input,
 * badge). Each component declares its `category` so the dynamic
 * route can validate that `(category, component)` is a coherent
 * pair and return 404 otherwise.
 *
 * V2 ships every component as `free` tier — no premium gate.
 * The tier field is kept on the type for forward-compatibility
 * with V3 billing.
 *
 * V2 hand-maintained. V3 reads from `packages/ui/src/components/*.tsx`
 * (auto-generation) instead of this list.
 */

import type { CategoryId } from "./categories"

export type ComponentTier = "free" | "pro"

export type ComponentCategoryId = CategoryId

export type CatalogueComponent = {
  /** URL slug. Must match the `slug` of its category in `categories.ts`. */
  slug: CategoryId
  /** Display name. */
  name: string
  /** Short one-line description. */
  description: string
  /** Category the component belongs to. Multiple components per
   *  category — the 5 components in `button` are all `category:
   *  "button"`. */
  category: ComponentCategoryId
  /** Price tier. V2 ships every component as `free`. */
  tier: ComponentTier
}

/** Tier order used by the catalog filter. "all" is the no-op default. */
export const TIER_ORDER = ["all", "free", "pro"] as const
export type TierFilter = (typeof TIER_ORDER)[number]

export const CATALOGUE_COMPONENTS: ReadonlyArray<CatalogueComponent> = [
  // ── button (5) ───────────────────────────────────────────────
  {
    slug: "button",
    name: "Button",
    description:
      "The base interactive primitive. Variants, sizes, and states.",
    category: "button",
    tier: "free",
  },
  {
    slug: "button-group",
    name: "ButtonGroup",
    description:
      "Group related buttons with shared borders and consistent spacing.",
    category: "button",
    tier: "free",
  },
  {
    slug: "split-button",
    name: "SplitButton",
    description:
      "Primary action with a chevron trigger for a secondary dropdown.",
    category: "button",
    tier: "free",
  },
  {
    slug: "icon-button",
    name: "IconButton",
    description:
      "Square icon-only button. Use for toolbar actions and dense nav.",
    category: "button",
    tier: "free",
  },
  {
    slug: "loading-button",
    name: "LoadingButton",
    description:
      "Button with an inline spinner and a disabled state while the action is in flight.",
    category: "button",
    tier: "free",
  },

  // ── input (5) ────────────────────────────────────────────────
  {
    slug: "input",
    name: "Input",
    description:
      "Single-line text input. Controlled, accessible, keyboard-friendly.",
    category: "input",
    tier: "free",
  },
  {
    slug: "input-search",
    name: "SearchInput",
    description:
      "Search bar with debounce and a one-click clear button.",
    category: "input",
    tier: "free",
  },
  {
    slug: "input-otp",
    name: "OtpInput",
    description:
      "One-time-code input with auto-advance and paste support.",
    category: "input",
    tier: "free",
  },
  {
    slug: "input-tags",
    name: "TagsInput",
    description:
      "Tag input with chips. Add with Enter, remove with Backspace.",
    category: "input",
    tier: "free",
  },
  {
    slug: "textarea",
    name: "Textarea",
    description: "Multi-line text input. Auto-grows with content.",
    category: "input",
    tier: "free",
  },

  // ── badge (5) ────────────────────────────────────────────────
  {
    slug: "badge",
    name: "Badge",
    description: "Status pill for inline labels. Variants and colors.",
    category: "badge",
    tier: "free",
  },
  {
    slug: "badge-dot",
    name: "DotBadge",
    description: "Badge with a leading status dot. Online, offline, sync states.",
    category: "badge",
    tier: "free",
  },
  {
    slug: "badge-removable",
    name: "RemovableBadge",
    description: "Badge with a close button. Use for tag inputs and filters.",
    category: "badge",
    tier: "free",
  },
  {
    slug: "badge-icon",
    name: "IconBadge",
    description: "Badge with a leading icon. Counters, status, notifications.",
    category: "badge",
    tier: "free",
  },
  {
    slug: "badge-numeric",
    name: "NumericBadge",
    description: "Counter badge. Caps at 99 (renders as 99+).",
    category: "badge",
    tier: "free",
  },
]

/**
 * Look up a component by slug. Returns undefined if the slug is
 * not in the catalogue. The caller is responsible for verifying
 * the category match.
 */
export function getComponent(slug: string): CatalogueComponent | undefined {
  return CATALOGUE_COMPONENTS.find((component) => component.slug === slug)
}

/**
 * Generate every `(category, component)` pair that should be
 * pre-rendered. Used by `generateStaticParams` at the leaf route.
 */
export function getAllComponentParams(): Array<{
  category: string
  component: string
}> {
  // Group by category, then enumerate every (category, slug)
  // pair — every category now has multiple components, so the
  // return list is the full flat product.
  const out: Array<{ category: string; component: string }> = []
  for (const component of CATALOGUE_COMPONENTS) {
    out.push({ category: component.category, component: component.slug })
  }
  return out
}