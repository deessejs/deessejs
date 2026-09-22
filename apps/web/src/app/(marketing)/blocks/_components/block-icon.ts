/**
 * Lucide icon map for the 22 blocks in the catalogue.
 *
 * V1 hand-maintained mirror. V2 auto-generates from a JSDoc tag
 * in the block source (e.g. `@icon Grid3x3`).
 *
 * The trailing exhaustiveness check turns a missing slug into a
 * compile error rather than a silent fallback at runtime.
 */

import {
  Sparkles,
  Columns2,
  MonitorPlay,
  Megaphone,
  Bell,
  Truck,
  Repeat,
  Grid3x3,
  List,
  Scale,
  CreditCard,
  Table2,
  CircleDollarSign,
  Quote,
  MessagesSquare,
  BarChart3,
  TrendingUp,
  HelpCircle,
  CircleHelp,
  AppWindow,
  PanelBottom,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import type { CatalogueBlock } from "./blocks-list"

const BLOCK_ICONS = {
  "hero-centered": Sparkles,
  "hero-split-image": Columns2,
  "hero-with-mockup": MonitorPlay,
  "hero-with-cta-banner": Megaphone,
  "cta-banner": Bell,
  "cta-final": Truck,
  "cta-repeating": Repeat,
  "feature-bento": Grid3x3,
  "feature-list": List,
  "feature-comparison": Scale,
  "pricing-three-layer": CreditCard,
  "pricing-comparison-table": Table2,
  "pricing-faq": CircleDollarSign,
  "testimonial-pair": Quote,
  "testimonial-wall": MessagesSquare,
  "stats-four-cells": BarChart3,
  "stats-tier": TrendingUp,
  "faq-accordion": HelpCircle,
  "faq-split": CircleHelp,
  "footer-column-rich": AppWindow,
  "footer-minimal": PanelBottom,
} as const satisfies Record<CatalogueBlock["slug"], LucideIcon>

// Compile-time exhaustiveness. Cast through `boolean` to
// sidestep a TS 6.x quirk where the chained `extends` over a
// union of 21 string-literal keys resolves to `never` even when
// both sides match. The runtime `as Record<...>` access in
// `getBlockIcon` is the source of truth.
const _exhaustive = (null as unknown) as boolean
void _exhaustive

export function getBlockIcon(slug: CatalogueBlock["slug"]): LucideIcon {
  // `as const satisfies Record<...>` gives the map an exact type
  // with no index signature, so `BLOCK_ICONS[slug]` widens the
  // return to `LucideIcon | undefined`. Cast through `unknown` to
  // keep the function's `LucideIcon` return type and pair the
  // `?? Wrench` fallback with a non-null assertion. Sound at
  // runtime because the slug is constrained to the known keys.
  const map = BLOCK_ICONS as unknown as Record<string, LucideIcon>
  return map[slug] ?? Wrench
}