/**
 * Catalogue categories for /components/[category].
 *
 * Single source of truth — one category per component, named
 * after the human usage context (Button, Badge, Avatar...) rather
 * than after a role tier (Primitives, Forms, Overlays...).
 *
 * The `componentNames` string is rendered inline in the leaf
 * placeholder card so each category page reads as "the X of this
 * category are coming" instead of a generic "coming soon."
 */

export type CategoryId =
  | "button"
  | "badge"
  | "separator"
  | "skeleton"
  | "avatar"
  | "input"
  | "textarea"
  | "checkbox"
  | "select"
  | "switch"
  | "input-group"
  | "dialog"
  | "sheet"
  | "popover"
  | "tooltip"
  | "dropdown-menu"
  | "command"
  | "navigation-menu"
  | "sidebar"
  | "breadcrumb"
  | "accordion"
  | "collapsible"
  | "tabs"
  | "sonner"

export type ComponentCategory = {
  id: CategoryId
  /** URL slug. */
  slug: CategoryId
  /** Human label. Used in eyebrow and H1. */
  name: string
  /** One-line description shown in the lead paragraph. */
  description: string
  /** Inline list of components, rendered in the placeholder card. */
  componentNames: string
}

export const CATEGORY_ORDER: ReadonlyArray<CategoryId> = [
  "button",
  "badge",
  "separator",
  "skeleton",
  "avatar",
  "input",
  "textarea",
  "checkbox",
  "select",
  "switch",
  "input-group",
  "dialog",
  "sheet",
  "popover",
  "tooltip",
  "dropdown-menu",
  "command",
  "navigation-menu",
  "sidebar",
  "breadcrumb",
  "accordion",
  "collapsible",
  "tabs",
  "sonner",
]

export const COMPONENT_CATEGORIES: ReadonlyArray<ComponentCategory> = [
  {
    id: "button",
    slug: "button",
    name: "Button",
    description:
      "Trigger actions and navigation. Variants, sizes, and the building block for every interactive surface.",
    componentNames: "button",
  },
  {
    id: "badge",
    slug: "badge",
    name: "Badge",
    description:
      "Status pill for inline labels. Used for tags, counts, and status indicators across the catalogue.",
    componentNames: "badge",
  },
  {
    id: "separator",
    slug: "separator",
    name: "Separator",
    description:
      "Visual divider between sections. Horizontal or vertical, decorative or semantic.",
    componentNames: "separator",
  },
  {
    id: "skeleton",
    slug: "skeleton",
    name: "Skeleton",
    description:
      "Loading placeholder block. Matches the typography rhythm of the content it replaces.",
    componentNames: "skeleton",
  },
  {
    id: "avatar",
    slug: "avatar",
    name: "Avatar",
    description:
      "User avatar with fallback initials. Used in headers, comments, and activity feeds.",
    componentNames: "avatar",
  },
  {
    id: "input",
    slug: "input",
    name: "Input",
    description:
      "Single-line text input. Controlled, accessible, keyboard-friendly. The form layer every template wires against better-auth and Drizzle.",
    componentNames: "input",
  },
  {
    id: "textarea",
    slug: "textarea",
    name: "Textarea",
    description:
      "Multi-line text input. For long-form fields, descriptions, and free-form answers.",
    componentNames: "textarea",
  },
  {
    id: "checkbox",
    slug: "checkbox",
    name: "Checkbox",
    description:
      "Boolean checkbox. Used for terms acceptance, multi-select lists, and toggles inside forms.",
    componentNames: "checkbox",
  },
  {
    id: "select",
    slug: "select",
    name: "Select",
    description:
      "Single-value native dropdown. For picking from a fixed list of options.",
    componentNames: "select",
  },
  {
    id: "switch",
    slug: "switch",
    name: "Switch",
    description:
      "Persistent on/off toggle. For settings that take effect immediately, not on submit.",
    componentNames: "switch",
  },
  {
    id: "input-group",
    slug: "input-group",
    name: "InputGroup",
    description:
      "Input with addons or trailing buttons. Combines icon, label, and validation in a single field.",
    componentNames: "input-group",
  },
  {
    id: "dialog",
    slug: "dialog",
    name: "Dialog",
    description:
      "Centered modal with focus trap. Used for confirmations, forms in a modal, and dismissible flows.",
    componentNames: "dialog",
  },
  {
    id: "sheet",
    slug: "sheet",
    name: "Sheet",
    description:
      "Side-panel modal. Used for filters, settings, and side-detail views without leaving the page.",
    componentNames: "sheet",
  },
  {
    id: "popover",
    slug: "popover",
    name: "Popover",
    description:
      "Anchored non-modal popup. Used for dropdowns anchored to a trigger, contextual info, and inline pickers.",
    componentNames: "popover",
  },
  {
    id: "tooltip",
    slug: "tooltip",
    name: "Tooltip",
    description:
      "Hover hint with delay. Used to annotate icon-only buttons and field-level help.",
    componentNames: "tooltip",
  },
  {
    id: "dropdown-menu",
    slug: "dropdown-menu",
    name: "DropdownMenu",
    description:
      "Action menu anchored to a trigger. Used for row actions in tables and account menus.",
    componentNames: "dropdown-menu",
  },
  {
    id: "command",
    slug: "command",
    name: "Command",
    description:
      "Command palette / search. The Cmd+K surface that lets power users jump anywhere fast.",
    componentNames: "command",
  },
  {
    id: "navigation-menu",
    slug: "navigation-menu",
    name: "NavigationMenu",
    description:
      "Site-wide navigation with dropdowns. Top-level menu items that open rich sub-menus.",
    componentNames: "navigation-menu",
  },
  {
    id: "sidebar",
    slug: "sidebar",
    name: "Sidebar",
    description:
      "Collapsible app shell sidebar. Persistent navigation for the dashboard and authenticated areas.",
    componentNames: "sidebar",
  },
  {
    id: "breadcrumb",
    slug: "breadcrumb",
    name: "Breadcrumb",
    description:
      "Nav trail of links. Anchors the user in deep hierarchies without taking up menu slots.",
    componentNames: "breadcrumb",
  },
  {
    id: "accordion",
    slug: "accordion",
    name: "Accordion",
    description:
      "Vertically stacked collapsible sections. For long lists of Q&As and grouped settings.",
    componentNames: "accordion",
  },
  {
    id: "collapsible",
    slug: "collapsible",
    name: "Collapsible",
    description:
      "Single show/hide disclosure. For sections that are not always relevant but should stay reachable.",
    componentNames: "collapsible",
  },
  {
    id: "tabs",
    slug: "tabs",
    name: "Tabs",
    description:
      "Tabbed content panels. For switching between views of the same resource without leaving the page.",
    componentNames: "tabs",
  },
  {
    id: "sonner",
    slug: "sonner",
    name: "Sonner",
    description:
      "Toast notifications. The only feedback primitive shipping today; the surface is small on purpose.",
    componentNames: "sonner",
  },
]

export function getCategory(id: string): ComponentCategory | undefined {
  return COMPONENT_CATEGORIES.find((category) => category.slug === id)
}