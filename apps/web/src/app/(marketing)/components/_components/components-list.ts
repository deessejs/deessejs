/**
 * Component catalogue for /components/[category]/[component].
 *
 * Mirrors the 24 primitives that ship in `@workspace/ui`. Each
 * component declares its `category` so the dynamic route can
 * validate that `(category, component)` is a coherent pair and
 * return 404 otherwise. V1 uses 1-category-per-component naming
 * (button, badge, avatar...) — the new taxonomy describes
 * usage context rather than functional tier.
 *
 * `tier` is the price tier advertised in the catalogue: "free"
 * primitives ship in every open-source shadcn registry; "pro"
 * systems compose multiple primitives into non-trivial UX
 * (Dialog, Sheet, Command, NavigationMenu, Sidebar) and gate
 * the build-time value of the templates that include them.
 *
 * V1 dummy. V2 reads from `packages/ui/src/components/*.tsx`
 * (auto-generation) instead of this hand-maintained list.
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
  /** Category the component belongs to. Same as `slug` in the new taxonomy. */
  category: CategoryId
  /** Price tier — "free" primitives or "pro" systems. */
  tier: ComponentTier
}

/** Tier order used by the catalog filter. "all" is the no-op default. */
export const TIER_ORDER = ["all", "free", "pro"] as const
export type TierFilter = (typeof TIER_ORDER)[number]

export const CATALOGUE_COMPONENTS: ReadonlyArray<CatalogueComponent> = [
  // One category per component — see /components/_components/categories.ts.
  {
    slug: "button",
    name: "Button",
    description: "Trigger actions and navigation.",
    category: "button",
    tier: "free",
  },
  {
    slug: "badge",
    name: "Badge",
    description: "Status pill for inline labels.",
    category: "badge",
    tier: "free",
  },
  {
    slug: "separator",
    name: "Separator",
    description: "Visual divider between sections.",
    category: "separator",
    tier: "free",
  },
  {
    slug: "skeleton",
    name: "Skeleton",
    description: "Loading placeholder block.",
    category: "skeleton",
    tier: "free",
  },
  {
    slug: "avatar",
    name: "Avatar",
    description: "User avatar with fallback initials.",
    category: "avatar",
    tier: "free",
  },
  {
    slug: "input",
    name: "Input",
    description: "Single-line text input.",
    category: "input",
    tier: "free",
  },
  {
    slug: "textarea",
    name: "Textarea",
    description: "Multi-line text input.",
    category: "textarea",
    tier: "free",
  },
  {
    slug: "checkbox",
    name: "Checkbox",
    description: "Boolean checkbox.",
    category: "checkbox",
    tier: "free",
  },
  {
    slug: "select",
    name: "Select",
    description: "Single-value native dropdown.",
    category: "select",
    tier: "free",
  },
  {
    slug: "switch",
    name: "Switch",
    description: "Persistent on/off toggle.",
    category: "switch",
    tier: "free",
  },
  {
    slug: "input-group",
    name: "InputGroup",
    description: "Input with addons or trailing buttons.",
    category: "input-group",
    tier: "free",
  },
  {
    slug: "dialog",
    name: "Dialog",
    description: "Centered modal with focus trap.",
    category: "dialog",
    tier: "pro",
  },
  {
    slug: "sheet",
    name: "Sheet",
    description: "Side-panel modal.",
    category: "sheet",
    tier: "pro",
  },
  {
    slug: "popover",
    name: "Popover",
    description: "Anchored non-modal popup.",
    category: "popover",
    tier: "free",
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    description: "Hover hint with delay.",
    category: "tooltip",
    tier: "free",
  },
  {
    slug: "dropdown-menu",
    name: "DropdownMenu",
    description: "Action menu anchored to a trigger.",
    category: "dropdown-menu",
    tier: "free",
  },
  {
    slug: "command",
    name: "Command",
    description: "Command palette / search.",
    category: "command",
    tier: "pro",
  },
  {
    slug: "navigation-menu",
    name: "NavigationMenu",
    description: "Site-wide navigation with dropdowns.",
    category: "navigation-menu",
    tier: "pro",
  },
  {
    slug: "sidebar",
    name: "Sidebar",
    description: "Collapsible app shell sidebar.",
    category: "sidebar",
    tier: "pro",
  },
  {
    slug: "breadcrumb",
    name: "Breadcrumb",
    description: "Nav trail of links.",
    category: "breadcrumb",
    tier: "free",
  },
  {
    slug: "accordion",
    name: "Accordion",
    description: "Vertically stacked collapsible sections.",
    category: "accordion",
    tier: "free",
  },
  {
    slug: "collapsible",
    name: "Collapsible",
    description: "Single show/hide disclosure.",
    category: "collapsible",
    tier: "free",
  },
  {
    slug: "tabs",
    name: "Tabs",
    description: "Tabbed content panels.",
    category: "tabs",
    tier: "free",
  },
  {
    slug: "sonner",
    name: "Sonner",
    description: "Toast notifications.",
    category: "sonner",
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
  return CATALOGUE_COMPONENTS.map((component) => ({
    category: component.category,
    component: component.slug,
  }))
}

/**
 * Recommend components related to the given slug. Used by the
 * "Related components" rail on each leaf page.
 *
 * Heuristic: with the new 1-category-per-component taxonomy,
 * every category has exactly one component, so same-category
 * siblings (excluding the current slug) is always empty. Fall
 * through to the first `limit` entries of `CATALOGUE_COMPONENTS`,
 * skipping the current slug. Stable, ordered — no surprise
 * reshuffles across re-renders.
 */
export function getRelatedComponents(
  slug: CatalogueComponent["slug"],
  limit = 4,
): ReadonlyArray<CatalogueComponent> {
  const current = CATALOGUE_COMPONENTS.find((c) => c.slug === slug)
  if (!current) return []

  const sameCategory = CATALOGUE_COMPONENTS.filter(
    (c) => c.category === current.category && c.slug !== slug,
  )

  if (sameCategory.length >= limit) {
    return sameCategory.slice(0, limit)
  }

  // Fallback: top up with the first entries of the catalogue that
  // belong to other categories. Stable, alphabetical-by-source
  // — no surprise reshuffles across re-renders.
  const fillers = CATALOGUE_COMPONENTS.filter(
    (c) => c.slug !== slug && c.category !== current.category,
  )

  return [...sameCategory, ...fillers].slice(0, limit)
}