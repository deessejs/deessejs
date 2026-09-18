/**
 * Catalogue categories for /components/[category].
 *
 * Single source of truth for the six buckets the primitives in
 * `@workspace/ui` will be grouped under. Each page reads from here,
 * and `/components` lists them in `CATEGORY_ORDER` for the future
 * filter tabs.
 *
 * The `componentNames` string is rendered inline in the placeholder
 * card so each category page reads as "the X, Y, Z of this category
 * are coming" instead of a generic "coming soon."
 */

export type CategoryId =
  | "primitives"
  | "forms"
  | "overlays"
  | "navigation"
  | "structure"
  | "feedback"

export type ComponentCategory = {
  id: CategoryId
  /** URL slug. */
  slug: CategoryId
  /** Human label. Used in eyebrow and H1. */
  name: string
  /** One-line description shown in the lead paragraph. */
  description: string
  /** Inline list of primitives, rendered in the placeholder card. */
  componentNames: string
}

export const CATEGORY_ORDER: ReadonlyArray<CategoryId> = [
  "primitives",
  "forms",
  "overlays",
  "navigation",
  "structure",
  "feedback",
]

export const COMPONENT_CATEGORIES: ReadonlyArray<ComponentCategory> = [
  {
    id: "primitives",
    slug: "primitives",
    name: "Primitives",
    description:
      "The building blocks. Button, Badge, Separator, Skeleton, Avatar — the primitives every other component composes on top of.",
    componentNames: "Button, Badge, Separator, Skeleton, Avatar",
  },
  {
    id: "forms",
    slug: "forms",
    name: "Forms",
    description:
      "Inputs, selects, toggles. Controlled, accessible, keyboard-friendly. The form layer every DeesseJS template wires against better-auth and Drizzle.",
    componentNames: "Input, Textarea, Checkbox, Select, Switch, InputGroup",
  },
  {
    id: "overlays",
    slug: "overlays",
    name: "Overlays",
    description:
      "Dialogs, sheets, popovers, dropdowns. Radix-powered focus traps, escape handling, and portal rendering — out of the box.",
    componentNames:
      "Dialog, Sheet, Popover, Tooltip, DropdownMenu, Command",
  },
  {
    id: "navigation",
    slug: "navigation",
    name: "Navigation",
    description:
      "Site headers, app shells, breadcrumbs. The chrome that turns a tree of pages into a navigable surface.",
    componentNames: "NavigationMenu, Sidebar, Breadcrumb",
  },
  {
    id: "structure",
    slug: "structure",
    name: "Structure",
    description:
      "Layout primitives that hold content together — disclosure widgets, tabbed interfaces, the container patterns every page composes from.",
    componentNames: "Accordion, Collapsible, Tabs",
  },
  {
    id: "feedback",
    slug: "feedback",
    name: "Feedback",
    description:
      "Toasts and notifications. The only feedback primitive shipping today is Sonner; the surface is small on purpose.",
    componentNames: "Sonner (toasts)",
  },
]

export function getCategory(id: string): ComponentCategory | undefined {
  return COMPONENT_CATEGORIES.find((category) => category.slug === id)
}