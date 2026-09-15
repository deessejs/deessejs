/**
 * Component catalogue for /components/[category]/[component].
 *
 * Mirrors the 25 primitives that ship in `@workspace/ui`. Each
 * component declares its `category` so the dynamic route can
 * validate that `(category, component)` is a coherent pair and
 * return 404 otherwise.
 *
 * V1 dummy. V2 reads from `packages/ui/src/components/*.tsx`
 * (auto-generation) instead of this hand-maintained list.
 */

export type ComponentCategoryId =
  | "primitives"
  | "forms"
  | "overlays"
  | "navigation"
  | "structure"
  | "feedback"

export type CatalogueComponent = {
  /** URL slug. */
  slug: string
  /** Display name. */
  name: string
  /** Short one-line description. */
  description: string
  /** Category the component belongs to. */
  category: ComponentCategoryId
}

export const CATALOGUE_COMPONENTS: ReadonlyArray<CatalogueComponent> = [
  // Primitives
  {
    slug: "button",
    name: "Button",
    description: "Trigger actions and navigation.",
    category: "primitives",
  },
  {
    slug: "badge",
    name: "Badge",
    description: "Status pill for inline labels.",
    category: "primitives",
  },
  {
    slug: "separator",
    name: "Separator",
    description: "Visual divider between sections.",
    category: "primitives",
  },
  {
    slug: "skeleton",
    name: "Skeleton",
    description: "Loading placeholder block.",
    category: "primitives",
  },
  {
    slug: "avatar",
    name: "Avatar",
    description: "User avatar with fallback initials.",
    category: "primitives",
  },

  // Forms
  {
    slug: "input",
    name: "Input",
    description: "Single-line text input.",
    category: "forms",
  },
  {
    slug: "textarea",
    name: "Textarea",
    description: "Multi-line text input.",
    category: "forms",
  },
  {
    slug: "checkbox",
    name: "Checkbox",
    description: "Boolean checkbox.",
    category: "forms",
  },
  {
    slug: "select",
    name: "Select",
    description: "Single-value native dropdown.",
    category: "forms",
  },
  {
    slug: "switch",
    name: "Switch",
    description: "Persistent on/off toggle.",
    category: "forms",
  },
  {
    slug: "input-group",
    name: "InputGroup",
    description: "Input with addons or trailing buttons.",
    category: "forms",
  },

  // Overlays
  {
    slug: "dialog",
    name: "Dialog",
    description: "Centered modal with focus trap.",
    category: "overlays",
  },
  {
    slug: "sheet",
    name: "Sheet",
    description: "Side-panel modal.",
    category: "overlays",
  },
  {
    slug: "popover",
    name: "Popover",
    description: "Anchored non-modal popup.",
    category: "overlays",
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    description: "Hover hint with delay.",
    category: "overlays",
  },
  {
    slug: "dropdown-menu",
    name: "DropdownMenu",
    description: "Action menu anchored to a trigger.",
    category: "overlays",
  },
  {
    slug: "command",
    name: "Command",
    description: "Command palette / search.",
    category: "overlays",
  },

  // Navigation
  {
    slug: "navigation-menu",
    name: "NavigationMenu",
    description: "Site-wide navigation with dropdowns.",
    category: "navigation",
  },
  {
    slug: "sidebar",
    name: "Sidebar",
    description: "Collapsible app shell sidebar.",
    category: "navigation",
  },
  {
    slug: "breadcrumb",
    name: "Breadcrumb",
    description: "Nav trail of links.",
    category: "navigation",
  },

  // Structure
  {
    slug: "accordion",
    name: "Accordion",
    description: "Vertically stacked collapsible sections.",
    category: "structure",
  },
  {
    slug: "collapsible",
    name: "Collapsible",
    description: "Single show/hide disclosure.",
    category: "structure",
  },
  {
    slug: "tabs",
    name: "Tabs",
    description: "Tabbed content panels.",
    category: "structure",
  },

  // Feedback
  {
    slug: "sonner",
    name: "Sonner",
    description: "Toast notifications.",
    category: "feedback",
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