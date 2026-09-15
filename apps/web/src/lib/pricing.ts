/**
 * Pricing config for the /pricing page.
 *
 * Single source of truth for the licensing model defined in
 * documents/internal/product/pricing.md. All copy strings here come from
 * that strategy doc. No prose is duplicated in JSX.
 *
 * The page is organized around license TYPES (how your license works),
 * not around product tiers (what you buy):
 *
 *   1. Open Community — MIT, free, community-driven. No license to manage.
 *   2. Per-project license — $299 one-shot, lifetime, every project you ship.
 *      Source code shipped on day one.
 *   3. Enterprise — custom engagement, multi-template bundles, dedicated
 *      support, procurement-friendly invoicing.
 *   4. Subscription — $23/month, ongoing access to updates and new
 *      templates. Optional, on top of the per-project license. Cancel any
 *      time — what you've already cloned stays usable.
 *
 * Adding a new license type or changing prices means:
 *   1. Update the strategy doc first.
 *   2. Mirror the change here.
 *   3. Update the comparison table in the page.
 */

export type LicenseTypeId =
  | "open-community"
  | "per-project"
  | "enterprise"
  | "subscription"

export type PricingPrice =
  | { kind: "free" }
  | { kind: "fixed"; amount: number; currency: "USD" }
  | { kind: "custom" }
  | { kind: "subscription"; amount: number; currency: "USD"; cadence: "month" | "year" }

/**
 * License types shown as cards on the page (top three), plus the
 * optional Subscription rendered as a horizontal banner below the
 * three cards.
 *
 * Per-project and Subscription are two parts of the same Pro offer:
 * the per-project license unlocks the codebase once, the subscription
 * unlocks updates and new releases over time. They are presented as
 * one card each (because their pricing cadence is different) but they
 * are not mutually exclusive — most teams buy both.
 */
export type LicenseType = {
  id: LicenseTypeId
  name: string
  tagline: string
  /** One-line self-selection cue ("For X") rendered above the CTA. */
  forWho: string
  price: PricingPrice
  positioning: string
  ships: ReadonlyArray<string>
  cta: { label: string; href: string; external?: boolean }
  /** Highlights the recommended card on the page (one only). */
  recommended?: boolean
  /** Renders as a horizontal banner instead of a card. */
  banner?: boolean
}

export const LICENSE_TYPES: ReadonlyArray<LicenseType> = [
  {
    id: "open-community",
    name: "Open Community",
    tagline: "Free, MIT. The floor of the catalog.",
    forWho: "For solo devs and weekend projects.",
    price: { kind: "free" },
    positioning:
      "Templates contributed by the community, with no production guarantees. Quality bar: does it compile, does it run, does it cover a real use case?",
    ships: [
      "Landing pages, dashboards, B2B starters, internal tools",
      "Free and MIT-licensed. No app count, no seat count, no deploy cap",
      "Pull-requests accepted from anyone, reviewed by a DeesseJS maintainer",
    ],
    cta: { label: "Browse templates", href: "/templates" },
  },
  {
    id: "per-project",
    name: "Pro",
    tagline: "$299 one-shot. Lifetime. Every project you ship.",
    forWho: "For freelance devs and in-house teams saving engineering time.",
    price: { kind: "fixed", amount: 299, currency: "USD" },
    positioning:
      "Production-grade templates for teams that ship for a living. Source code is yours on day one, deployable on your infra. One license covers every project you ship. No per-project cap, no per-seat count.",
    ships: [
      "Source code for every Pro template at the time of purchase",
      "Use across every project you ship. No per-project cap, no per-seat count.",
      "14-day refund window, no questions asked",
    ],
    cta: {
      label: "Join now",
      href: "/join/pro",
    },
    recommended: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom engagements for regulated and large teams.",
    forWho: "For enterprise teams in regulated industries.",
    price: { kind: "custom" },
    positioning:
      "Tailored Pro engagements: multi-template bundles, custom scaffolding, dedicated support, and procurement-friendly invoicing. Per the engagement contract.",
    ships: [
      "Multi-template bundles across your stack",
      "Custom scaffolding on top of a Pro template",
      "Dedicated support and procurement-friendly invoicing",
    ],
    cta: {
      label: "Contact us",
      href: "/enterprise",
    },
  },
  {
    id: "subscription",
    name: "Subscription",
    tagline: "Pro, paid monthly. Same access, lower upfront.",
    forWho: "For freelancers who want Pro without the $299 upfront, and are okay paying ongoing.",
    price: {
      kind: "subscription",
      amount: 23,
      currency: "USD",
      cadence: "month",
    },
    positioning:
      "The Pro catalog, paid as a subscription instead of a one-shot. Same templates, same source code access, same updates. Only the payment cadence changes. Cancel any time; what you've already cloned stays usable.",
    ships: [
      "Every Pro template available the moment it ships",
      "Source code access for every template released during the subscription",
      "Resubscribe any time; same access, no penalty",
    ],
    cta: {
      label: "Subscribe",
      href: "/join/pro?cadence=monthly",
    },
    banner: true,
  },
] as const

/**
 * The three license types that appear as columns in the comparison
 * table. Subscription is rendered as a horizontal banner below the
 * cards and also appears in the comparison table as a third column.
 */
export type ComparisonLayerId = "open-community" | "per-project" | "subscription"

export type ComparisonRow = {
  attribute: string
  values: Record<ComparisonLayerId, string>
}

export const COMPARISON_LAYERS: ReadonlyArray<{
  id: ComparisonLayerId
  name: string
}> = [
  { id: "open-community", name: "Open Community" },
  { id: "per-project", name: "Per-project" },
  { id: "subscription", name: "Subscription" },
]

/**
 * Comparison rows grouped by intent. Buyers can scan by intent instead
 * of reading a flat list. The "Post-cancellation" row in Rights &
 * terms reflects the per-project + subscription split: what you keep
 * vs. what stops when you cancel.
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
          "per-project": "$299 one-shot, every project you ship",
          subscription: "$23 / month, on top of a per-project license",
        },
      },
      {
        attribute: "License",
        values: {
          "open-community": "MIT",
          "per-project": "Lifetime, every project you ship, no per-project cap",
          subscription: "Same per-project license, with ongoing updates entitlement",
        },
      },
      {
        attribute: "Source code",
        values: {
          "open-community": "Included",
          "per-project": "Included on day one",
          subscription: "Already included with the per-project license",
        },
      },
      {
        attribute: "Project scope",
        values: {
          "open-community": "Unlimited",
          "per-project": "Unlimited. Every project you ship under one license.",
          subscription: "Same as the per-project license it extends",
        },
      },
      {
        attribute: "Submission flow",
        values: {
          "open-community": "Pull-request",
          "per-project": "Authored by the DeesseJS team",
          subscription: "Authored by the DeesseJS team",
        },
      },
      {
        attribute: "Quality bar",
        values: {
          "open-community": "Does it ship end-to-end?",
          "per-project": "Production patterns a CISO expects",
          subscription: "Same as per-project, kept current",
        },
      },
    ],
  },
  {
    heading: "Updates & maintenance",
    rows: [
      {
        attribute: "Updates",
        values: {
          "open-community": "Community-driven, always current",
          "per-project": "Available while a subscription is active",
          subscription: "Every update ships during the subscription",
        },
      },
      {
        attribute: "New templates",
        values: {
          "open-community": "Open to anyone in the catalog",
          "per-project": "Available with an active subscription",
          subscription: "Every new Pro template released during the term",
        },
      },
      {
        attribute: "Security patches",
        values: {
          "open-community": "Community-driven",
          "per-project": "Patched while a subscription is active",
          subscription: "Patched during the subscription, by the DeesseJS team",
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
          "per-project": "14 days, no questions asked",
          subscription: "Pro-rated, self-serve in the billing portal",
        },
      },
      {
        attribute: "Re-sell rights",
        values: {
          "open-community": "MIT allows re-use",
          "per-project": "Re-sell to a client OK; unmodified template may not appear in another catalog",
          subscription: "Same as per-project, while the subscription is active",
        },
      },
      {
        attribute: "Post-cancellation",
        values: {
          "open-community": "N/A",
          "per-project": "What you've already cloned stays usable forever",
          subscription: "Templates you've deployed keep running; updates stop",
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
 * FAQ split into three topical groups. Order is intentional: most
 * buyers ask about licensing and post-cancellation first, then billing,
 * then catalog mechanics.
 */
export const PRICING_FAQ_GROUPS: ReadonlyArray<FaqGroup> = [
  {
    heading: "Licensing & re-sell",
    items: [
      {
        question: "How does per-project licensing work?",
        answer:
          "One per-project license unlocks the codebase across every project you ship. There is no per-project cap, no per-seat count. Add a subscription on top to keep the codebase current as the DeesseJS team ships new templates and security patches.",
      },
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
        question: "Can I switch a template between license types?",
        answer:
          "Open Community and Pro Education share the same templates under different license terms. Moving from one to the other is just a verification step. The per-project license and the subscription are two parts of the same Pro offer, not an upgrade path between them.",
      },
    ],
  },
  {
    heading: "Post-cancellation & updates",
    items: [
      {
        question: "What happens to my templates if I cancel the subscription?",
        answer:
          "Templates you've already cloned into your repositories stay there. Templates you've already deployed continue to run. New templates released after cancellation are not added to your access, and updates and security patches stop landing in your mailbox.",
      },
      {
        question: "Can I re-subscribe later?",
        answer:
          "Yes, any time. Re-subscribing picks up where you left off: same templates, same updates, same support tier. No penalty, no re-onboarding fee.",
      },
      {
        question: "Do deployed templates stop working when I cancel?",
        answer:
          "No. The codebase is yours on day one. Templates already deployed on your infrastructure continue to run. No telemetry, no phone-home, no kill switch.",
      },
      {
        question: "Do I still get security patches after cancelling?",
        answer:
          "Only during the subscription. After cancellation, security patches are not delivered. The codebase you already have is yours to patch yourself if needed.",
      },
    ],
  },
  {
    heading: "Billing & refund",
    items: [
      {
        question: "What is the difference between Pro and the Subscription?",
        answer:
          "None on what you get. Both unlock the full Pro catalog, source code access, and every new template. The only difference is the payment cadence: Pro is $299 paid once, the Subscription is $23 paid every month. Pick the cadence that fits your cash flow.",
      },
      {
        question: "Can I switch from one to the other?",
        answer:
          "Yes. You can switch from Pro to the Subscription (your Pro payment is pro-rated against future subscription months), or from the Subscription to Pro (your subscription months are pro-rated against the $299). Switch any time in the billing portal.",
      },
      {
        question: "Why $299 for Pro?",
        answer:
          "It's the bottom of the templates-catalog band. The upgrade from Open Community is meant to be cheap enough that you don't have to justify it internally, under two hours of senior dev time.",
      },
      {
        question: "Why $23 / month for the Subscription?",
        answer:
          "It's the floor of the templates-subscription band. Comparable to one senior dev hour per month, and well below the cost of one security audit per quarter. The annual equivalent ($276) is also less than $299, which is the point.",
      },
      {
        question: "Do you have a refund policy?",
        answer:
          "14 days, no questions asked on the Pro payment. The Subscription is pro-rated and self-serve in the billing portal.",
      },
      {
        question: "Can I try a Pro template before buying?",
        answer:
          "Yes. Open Community templates share the same architecture as Pro templates. Cloning an Open Community template gives you a working preview of how Pro templates are structured.",
      },
    ],
  },
  {
    heading: "Templates & roadmap",
    items: [
      {
        question: "Why license types and not tiers?",
        answer:
          "A per-project license and a subscription are not tiers of the same product, they're two parts of the same offer. Conflating them would force a buyer to choose between owning the code and staying current; the model lets them have both, or either.",
      },
      {
        question: "Which stacks does Pro cover?",
        answer:
          "Next.js, Astro, Tailwind, shadcn/ui, Drizzle, Postgres, Stripe, TanStack Table, OpenAI, React Hook Form. The list lives in packages/api/src/templates.ts. When a new template lands there, it lands in the Pro catalog the same day.",
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
