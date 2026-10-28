/**
 * Lucide icon map for the 15 components in the catalogue.
 *
 * Hand-maintained mirror of `catalogue.ts`. V3 will
 * auto-generate from a JSDoc `@icon` tag in the source.
 *
 * The trailing exhaustiveness check turns a missing slug into a
 * compile error rather than a silent fallback at runtime.
 */

import {
  Square,
  Group,
  ChevronDown,
  Square as SquareIcon,
  Loader2,
  TextCursorInput,
  Search,
  Hash,
  Tag as TagIcon,
  AlignLeft,
  Tag,
  CircleDot,
  X,
  Sparkles,
  Circle,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import type { CatalogueComponent } from "./catalogue"

const COMPONENT_ICONS = {
  // button
  button: Square,
  "button-group": Group,
  "split-button": ChevronDown,
  "icon-button": SquareIcon,
  "loading-button": Loader2,
  // input
  input: TextCursorInput,
  "input-search": Search,
  "input-otp": Hash,
  "input-tags": TagIcon,
  textarea: AlignLeft,
  // badge
  badge: Tag,
  "badge-dot": CircleDot,
  "badge-removable": X,
  "badge-icon": Sparkles,
  "badge-numeric": Circle,
} as const satisfies Record<CatalogueComponent["slug"], LucideIcon>

const ICON_BY_SLUG = new Map(Object.entries(COMPONENT_ICONS))

export function getComponentIcon(slug: CatalogueComponent["slug"]): LucideIcon {
  return ICON_BY_SLUG.get(slug) ?? Wrench
}
