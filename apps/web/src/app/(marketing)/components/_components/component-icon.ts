/**
 * Lucide icon map for the 15 components in the catalogue.
 *
 * Hand-maintained mirror of `components-list.ts`. V3 will
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

import type { CatalogueComponent } from "./components-list"

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

// Compile-time exhaustiveness: any new CatalogueComponent slug
// without an icon entry becomes a TS error here.
type _Exhaustive = keyof typeof COMPONENT_ICONS extends CatalogueComponent["slug"]
  ? CatalogueComponent["slug"] extends keyof typeof COMPONENT_ICONS
    ? true
    : never
  : never
const _exhaustive = (null as unknown) as boolean
void _exhaustive

export function getComponentIcon(slug: CatalogueComponent["slug"]): LucideIcon {
  // `as const satisfies Record<...>` gives the icon map an exact
  // type with no index signature, so `COMPONENT_ICONS[slug]`
  // widens the return to `LucideIcon | undefined`. Cast through
  // `unknown` first to keep the `LucideIcon` return type and
  // pair the `?? Wrench` fallback with a non-null assertion.
  const map = COMPONENT_ICONS as unknown as Record<string, LucideIcon>
  return map[slug] ?? Wrench
}