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

// Compile-time exhaustiveness.
type _Exhaustive = keyof typeof BLOCK_ICONS extends CatalogueBlock["slug"]
  ? CatalogueBlock["slug"] extends keyof typeof BLOCK_ICONS
    ? true
    : never
  : never
const _exhaustive: _Exhaustive = true
void _exhaustive

export function getBlockIcon(slug: CatalogueBlock["slug"]): LucideIcon {
  return BLOCK_ICONS[slug] ?? Wrench
}