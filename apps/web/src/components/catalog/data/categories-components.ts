/**
 * Catalogue categories for the components registry at
 * /components/[category]. V2 ships three categories: button,
 * input, badge. Each category has 5 components in
 * `catalogue-components.ts` (one per component slug under the
 * same category id).
 *
 * No `componentNames` field anymore: the placeholder card prose
 * is built directly from the category description, not from a
 * hardcoded list.
 */

import type { CatalogCategory } from "./types"

export type CategoryId = "button" | "input" | "badge"

export type ComponentCategory = CatalogCategory & {
  id: CategoryId
  slug: CategoryId
}

export const CATEGORY_ORDER: ReadonlyArray<CategoryId> = [
  "button",
  "input",
  "badge",
]

export const COMPONENT_CATEGORIES: ReadonlyArray<ComponentCategory> = [
  {
    id: "button",
    slug: "button",
    name: "Buttons",
    description:
      "Trigger actions and navigation. Variants, sizes, groups, and loaders - the building block for every interactive surface.",
  },
  {
    id: "input",
    slug: "input",
    name: "Inputs",
    description:
      "Single-line, multi-line, search, OTP, tags. Controlled, accessible, keyboard-friendly. The form layer every DeesseJS template wires against.",
  },
  {
    id: "badge",
    slug: "badge",
    name: "Badges",
    description:
      "Status pills, counters, tags. The smallest surface in the design system, but the most reused.",
  },
]

export function getCategory(id: string): ComponentCategory | undefined {
  return COMPONENT_CATEGORIES.find((category) => category.slug === id)
}
