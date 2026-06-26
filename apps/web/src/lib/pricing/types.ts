/**
 * Pricing data types for the DeesseJS marketing site.
 *
 * Mirrors the structure of apps/web/src/lib/blog/types.ts — plain types,
 * zero runtime deps, consumed by the route file and its sub-components.
 */

/** A single pricing tier. */
export interface Tier {
  /** Display name. e.g. "Starter", "Pro", "Team". */
  name: string
  /** One-line positioning. e.g. "For solo founders shipping their first SaaS." */
  description: string
  /** Regular price in USD (lifetime, one-time). */
  regularPrice: number
  /** Founder-price in USD. Shown with line-through regular price above. */
  founderPrice: number
  /** Bullet list of included features, in display order. */
  features: string[]
  /** CTA label (e.g. "Get Starter"). */
  cta: string
  /** Whether this tier is visually highlighted ("Most popular"). */
  highlighted: boolean
  /** Anchor slug for in-page CTAs. */
  slug?: string
  /** External buy URL. If absent, the CTA anchors to `#${slug}`. */
  buyUrl?: string
}

/**
 * Cell value variants for the feature matrix.
 * The component decides icon/copy per variant.
 */
export type FeatureCellValue =
  | boolean
  | string
  | number
  | { kind: "text"; value: string }
  | { kind: "tooltip"; value: string; hint: string }
  | { kind: "dash" }
  | { kind: "enterprise"; contact: string }

/** A single row in the feature matrix. */
export interface FeatureRow {
  /** Display label. e.g. "Seats", "Storage", "Audit log retention". */
  label: string
  /** Optional clarifying copy shown on hover via Tooltip on the label cell. */
  hint?: string
  /** Cell value per tier, in the same order as the `tiers` array passed in. */
  values: FeatureCellValue[]
}

/** A grouped set of rows in the feature matrix. */
export interface FeatureCategory {
  /** Group name shown as a full-width header band. */
  name: string
  /** Optional one-line description under the header. */
  description?: string
  rows: FeatureRow[]
}

/** Founder-member offer block (top of the /pricing page). */
export interface FounderOffer {
  /** Headline strip label. e.g. "Founding-member offer". */
  label: string
  /** "Regular" anchor price shown with line-through. */
  regularPrice: number
  /** Special founder price. */
  price: number
  /** Unit. e.g. "one-time · lifetime". */
  unit: string
  /** Body copy. */
  body: string
  /** Cap, e.g. 50. */
  cap: number
  /** Number already claimed. Static for now; env-var later. */
  claimed: number
  /** Closing date in ISO YYYY-MM-DD form. */
  closesAt: string
}

/** Money-back guarantee block. */
export interface Guarantee {
  label: string
  body: string
  /** Optional tooltip body explaining refund process. */
  detail?: string
}

/** Single "DeesseJS vs supastarter vs MakerKit" row. */
export interface ComparisonRow {
  /** Row label (e.g. "Built for AI agents"). */
  label: string
  /** Values per platform: deessejs, supastarter, makerkit. */
  values: [string, string, string]
}

/** A complete comparison block (one card). */
export interface ComparisonBlock {
  /** Block title. */
  title: string
  rows: ComparisonRow[]
}

/** Proof-row item: a "what you ship on day 1" tile. */
export interface ProofItem {
  title: string
  caption: string
  /** Path to a screenshot under /public. Optional — render a placeholder if undefined. */
  image?: string
}

/** Pricing-specific FAQ entry. */
export interface PricingFaq {
  question: string
  answer: string
}