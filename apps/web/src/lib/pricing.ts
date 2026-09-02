/**
 * Pricing config for the /pricing page.
 *
 * Single source of truth for the three-layer model defined in
 * documents/internal/product/pricing.md. All copy strings here come from
 * that strategy doc. No prose is duplicated in JSX.
 *
 * Adding a fourth layer or changing prices means:
 *   1. Update the strategy doc first.
 *   2. Mirror the change here.
 *   3. Update the comparison table in the page.
 */

export type PricingLayerId =
  | "open-community"
  | "pro"
  | "enterprise"
  | "pro-education"

export type PricingPrice =
  | { kind: "free" }
  | { kind: "fixed"; amount: number; currency: "USD" }
  | { kind: "custom" }

export type PricingLayer = {
  id: PricingLayerId
  name: string
  tagline: string
  /** One-line self-selection cue ("For X") rendered above the CTA. */
  forWho: string
  price: PricingPrice
  positioning: string
  ships: ReadonlyArray<string>
  cta: { label: string; href: string; external?: boolean }
}

export const PRICING_LAYERS: ReadonlyArray<PricingLayer> = [
  {
    id: "open-community",
    name: "Open Community",
    tagline: "Free, MIT. The floor of the catalog.",
    forWho: "For solo devs and weekend projects.",
    price: { kind: "free" },
    positioning:
      "Templates any developer can write in one afternoon. Quality bar: does it ship end-to-end?",
    ships: [
      "Landing pages, dashboards, B2B starters, internal tools",
      "Free and MIT-licensed. No app count, no seat count, no deploy cap",
      "Pull-requests accepted from anyone, reviewed by a DeesseJS maintainer",
    ],
    cta: { label: "Browse templates", href: "/templates" },
  },
  {
    id: "pro",
    name: "DeesseJS Pro",
    tagline: "One payment. Lifetime access. Every Pro template, including future ones.",
    forWho: "For freelance devs and in-house teams saving engineering time.",
    price: { kind: "fixed", amount: 299, currency: "USD" },
    positioning:
      "Built by the DeesseJS team: SaaS Pro, AI Production, Compliance Pro, Marketplace Pro. Source code shipped with each one. Cloud access included.",
    ships: [
      "Lifetime access: every Pro template, including the ones we ship after you buy",
      "Source code delivered. Cloud access (auth, repo, CLI clone) for each template",
      "14-day refund window. No questions asked.",
    ],
    cta: {
      label: "Email us about Pro",
      href: "mailto:support@deessejs.com?subject=Pro%20package",
      external: true,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom engagements for regulated and large teams.",
    forWho: "For enterprise teams in regulated industries.",
    price: { kind: "custom" },
    positioning:
      "Tailored Pro engagements: multi-template bundles, custom scaffolding, dedicated support, and procurement-friendly invoicing.",
    ships: [
      "Multi-template bundles across your stack",
      "Custom scaffolding on top of a Pro template",
      "Dedicated support and procurement-ready invoicing",
    ],
    cta: {
      label: "Contact us",
      href: "/enterprise",
    },
  },
] as const

/**
 * Detailed comparison table rows. Row labels match pricing.md verbatim.
 * Each cell is a short string rendered inside a <td>; longer explanations
 * live in the FAQ.
 *
 * The table covers the three primary layers (Open Community, Pro, Enterprise).
 * Pro Education shares its templates with Open Community under a different
 * license. It is documented in the Refund and license section and in the FAQ
 * rather than as a fourth column, to keep the comparison readable.
 */
export type ComparisonLayerId = "open-community" | "pro" | "enterprise"

export type ComparisonRow = {
  attribute: string
  values: Record<ComparisonLayerId, string>
}

/**
 * The three layers that appear as columns in the comparison table.
 * Pro Education shares its templates with Open Community under a
 * different license. It lives in the Refund and license section and
 * in the FAQ instead.
 */
export const COMPARISON_LAYERS: ReadonlyArray<{
  id: ComparisonLayerId
  name: string
}> = [
  { id: "open-community", name: "Open Community" },
  { id: "pro", name: "DeesseJS Pro" },
  { id: "enterprise", name: "Enterprise" },
]

/**
 * Comparison rows grouped into three sections. Rows render under their
 * group heading so buyers can scan by intent instead of reading a flat
 * list. Each cell is a short string rendered inside a <td>; longer
 * explanations live in the FAQ.
 */
export type ComparisonGroup = {
  heading: string
  rows: ReadonlyArray<ComparisonRow>
}

export const COMPARISON_GROUPS: ReadonlyArray<ComparisonGroup> = [
  {
    heading: "What you ship",
    rows: [
      {
        attribute: "Price",
        values: {
          "open-community": "Free",
          pro: "$299 one-shot, lifetime access to every Pro template",
          enterprise: "Custom. Multi-template bundle or custom scaffolding",
        },
      },
      {
        attribute: "License",
        values: {
          "open-community": "MIT",
          pro: "Paid, source code delivered",
          enterprise: "Paid, with custom terms",
        },
      },
      {
        attribute: "Source code",
        values: {
          "open-community": "Included",
          pro: "Included",
          enterprise: "Included",
        },
      },
      {
        attribute: "Submission flow",
        values: {
          "open-community": "Pull-request",
          pro: "Authored by the DeesseJS team",
          enterprise: "Authored by the DeesseJS team, scoped per engagement",
        },
      },
      {
        attribute: "Quality bar",
        values: {
          "open-community": "Does it ship end-to-end?",
          pro: "Production patterns a CISO expects",
          enterprise: "Same as Pro, with custom integration",
        },
      },
    ],
  },
  {
    heading: "Updates & ownership",
    rows: [
      {
        attribute: "Updates",
        values: {
          "open-community": "Community-driven, always current",
          pro: "Every new template included",
          enterprise: "Negotiated per engagement",
        },
      },
      {
        attribute: "Future templates",
        values: {
          "open-community": "Open to anyone in the catalog",
          pro: "Included for life",
          enterprise: "Negotiated per engagement",
        },
      },
    ],
  },
  {
    heading: "Rights & terms",
    rows: [
      {
        attribute: "Refund window",
        values: {
          "open-community": "N/A",
          pro: "14 days, no questions asked",
          enterprise: "Per the engagement contract",
        },
      },
      {
        attribute: "Re-sell rights",
        values: {
          "open-community": "MIT allows re-use",
          pro: "Re-sell to a client OK; unmodified template may not appear in another catalog",
          enterprise: "Negotiated per engagement",
        },
      },
    ],
  },
] as const

/**
 * Flat union of all comparison rows, kept for callers that iterate the
 * rows in order (e.g. the Side-by-side section header counts).
 */
export const COMPARISON_ROWS: ReadonlyArray<ComparisonRow> =
  COMPARISON_GROUPS.flatMap((group) => group.rows)

/**
 * FAQ entries. Source content: open questions in pricing.md + the rules
 * visitors ask about most often.
 */
export type FaqItem = { question: string; answer: string }

export type FaqGroup = {
  heading: string
  items: ReadonlyArray<FaqItem>
}

/**
 * FAQ split into three topical groups, rendered as three accordions on
 * the pricing page. Order is intentional: most buyers ask about billing
 * first, then licensing, then catalog mechanics.
 */
export const PRICING_FAQ_GROUPS: ReadonlyArray<FaqGroup> = [
  {
    heading: "Billing & refund",
    items: [
      {
        question: "Why one-shot and not subscription?",
        answer:
          "The persona is a freelance dev finishing a client project, or an in-house team saving engineering time. A one-time purchase fits the project, not a recurring bill. A subscription product remains on the roadmap for v2.",
      },
      {
        question: "Why $299?",
        answer:
          "It's the bottom of the templates-catalog band. The upgrade from Open Community is meant to be cheap enough that you don't have to justify it internally, under two hours of senior dev time.",
      },
      {
        question: "Do you have a refund policy?",
        answer:
          "14 days, no questions asked. Email support@deessejs.com and we process it.",
      },
    ],
  },
  {
    heading: "Licensing & re-sell",
    items: [
      {
        question: "Can I re-sell a Pro template to a client?",
        answer:
          "Yes, if you are a freelancer building a client project. You may charge the client for the saved time. The unmodified template may not appear in another catalog.",
      },
      {
        question: "How does Pro Education verification work?",
        answer:
          "Send a .edu email or equivalent proof (student card, school-issued document) to support@deessejs.com. For OSS projects, link the repo where you are a maintainer. The license is bound to the verified buyer or project and may not be transferred to a non-OSS third party.",
      },
      {
        question: "Can I switch a template between layers?",
        answer:
          "Open Community and Pro Education are the same templates under different license terms. Moving from one to the other is just a verification step. Pro is a separate catalog entry, not an upgrade path.",
      },
    ],
  },
  {
    heading: "Templates & roadmap",
    items: [
      {
        question: "Why three layers and not three tiers?",
        answer:
          "Catalog items vary in effort. A landing page is one day, a multi-tenant SaaS is one sprint. The model reflects that. App counts and seat counts don't apply to a templates catalog.",
      },
      {
        question: "Which stacks does Pro cover?",
        answer:
          "Next.js, Astro, Tailwind, shadcn/ui, Drizzle, Postgres, Stripe, TanStack Table, OpenAI, React Hook Form. The list lives in packages/api/src/templates.ts. When a new template lands there, it lands in the Pro catalog the same day.",
      },
      {
        question: "Do I get new Pro templates after I buy?",
        answer:
          "Yes. Pro is a lifetime license for the full Pro package. Every Pro template the team ships after your purchase is included at no extra cost, including Cloud access for each one.",
      },
      {
        question: "What if the project shuts down?",
        answer:
          "Source code is yours from day one. There is no lock-in. If you want to leave, take it with you: no contract, no subscription, no renewal.",
      },
    ],
  },
] as const

/**
 * Flat union of every FAQ entry, kept for callers that need a single
 * sequence (search, JSON-LD structured data, etc.).
 */
export const PRICING_FAQ: ReadonlyArray<FaqItem> = PRICING_FAQ_GROUPS.flatMap(
  (group) => group.items,
)
