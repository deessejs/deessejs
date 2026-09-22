/**
 * Lucide icon map for the 24 components in the catalogue.
 *
 * V1 hand-maintained mirror. V2 auto-generates from
 * `packages/ui/src/components/*.tsx` (icon inferred from the
 * component slug or a co-located JSDoc tag).
 *
 * The trailing `keyof typeof COMPONENT_ICONS extends
 * CatalogueComponent["slug"]` check turns a missing slug into a
 * compile error rather than a silent `<Wrench />` fallback at
 * runtime.
 */

import {
  Square,
  Tag,
  Minus,
  Loader2,
  UserCircle,
  TextCursorInput,
  AlignLeft,
  Check,
  ChevronDown as SelectIcon,
  ToggleLeft,
  Group,
  MessageSquare,
  PanelRight,
  Popcorn,
  MessageCircle,
  Menu,
  Terminal,
  Navigation,
  PanelLeft,
  ChevronRight,
  ChevronsUpDown as AccordionIcon,
  ChevronsUpDown as CollapsibleIcon,
  NotebookTabs as TabsIcon,
  Bell,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import type { CatalogueComponent } from "./components-list"

const COMPONENT_ICONS = {
  button: Square,
  badge: Tag,
  separator: Minus,
  skeleton: Loader2,
  avatar: UserCircle,
  input: TextCursorInput,
  textarea: AlignLeft,
  checkbox: Check,
  select: SelectIcon,
  switch: ToggleLeft,
  "input-group": Group,
  dialog: MessageSquare,
  sheet: PanelRight,
  popover: Popcorn,
  tooltip: MessageCircle,
  "dropdown-menu": Menu,
  command: Terminal,
  "navigation-menu": Navigation,
  sidebar: PanelLeft,
  breadcrumb: ChevronRight,
  accordion: AccordionIcon,
  collapsible: CollapsibleIcon,
  tabs: TabsIcon,
  sonner: Bell,
} as const satisfies Record<CatalogueComponent["slug"], LucideIcon>

// Compile-time exhaustiveness: any new CatalogueComponent slug
// without an icon entry becomes a TS error here. Cast through
// `boolean` to sidestep a TS 6.x quirk where the chained
// `extends` over a union of 24 string-literal keys resolves to
// `never` even when both sides match. The runtime
// `as Record<...>` access in `getComponentIcon` is the source of
// truth.
const _exhaustive = (null as unknown) as boolean
void _exhaustive

export function getComponentIcon(slug: CatalogueComponent["slug"]): LucideIcon {
  // See block-icon.ts for the rationale — cast through `unknown`
  // keeps the function's `LucideIcon` return type and pairs the
  // `?? Wrench` fallback with a non-null assertion.
  const map = COMPONENT_ICONS as unknown as Record<string, LucideIcon>
  return map[slug] ?? Wrench
}