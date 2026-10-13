/**
 * Pricing config for the /pricing page.
 *
 * Single source of truth for the licensing model. The strategy that
 * shaped these copy strings is the subscription-only model: every
 * paid tier (Professional, Agency) is a subscription billed monthly
 * or annually. There is no lifetime one-shot in the standard offer;
 * projects in production at the time of cancellation remain covered
 * under the post-cancel reuse policy below, but starting a new
 * project after cancellation requires a resubscription.
 *
 * The page is organized around license TYPES (how your license
 * works), not around product tiers (what you buy):
 *
 *   1. Community — MIT, free, community-driven. No license to manage.
 *   2. Professional — $29 / month or $299 / year, taxes included.
 *      Same catalog regardless of cadence. Annual saves two months.
 *   3. Agency & Team — $79 / month or $799 / year, taxes included.
 *      5 seats, Commercial Extended License, Figma source.
 *   4. Enterprise — Custom engagement, paperwork-level (SLA, DPAs,
 *      procurement). Rendered in its own section, not as a card.
 *
 * Adding a new license type or changing prices means:
 *   1. Update this file (single source of truth).
 *   2. Verify the comparison table still reads coherently.
 *   3. Verify the price block and tier card still match.
 */

export type BillingCadence = "monthly" | "annual"

export type Currency = "USD"

export type PlanPricing =
  | { kind: "free" }
  | {
      kind: "subscription"
      currency: Currency
      /**
       * Monthly billing: the amount charged every month. Used as
       * the headline figure on the monthly cadence.
       */
      monthly: { amount: number }
      /**
       * Annual billing: the total amount charged once for the year.
       * The page derives the monthly-equivalent
       * (`annual.amount / 12`) and the savings percent
       * (`(1 - annual.amount / (monthly.amount * 12)) * 100`)
       * from these two values.
       */
      annual: { amount: number }
    }
  | { kind: "custom" }

/**
 * Compute the monthly-equivalent of an annual price and the savings
 * percent versus paying monthly for a year. Both are derived from
 * the configuration, never stored.
 */
export function annualBreakdown(price: Extract<PlanPricing, { kind: "subscription" }>): {
  monthlyEquivalent: number
  savingsPercent: number
} {
  const annualTotal = price.annual.amount
  const monthlyEquivalent = annualTotal / 12
  const annualIfMonthly = price.monthly.amount * 12
  const savingsPercent =
    annualIfMonthly > 0
      ? Math.round((1 - annualTotal / annualIfMonthly) * 1000) / 10
      : 0
  return { monthlyEquivalent, savingsPercent }
}

export type LicenseTypeId =
  | "open-community"
  | "professional"
  | "agency"
  | "enterprise"

export type LicenseType = {
  id: LicenseTypeId
  name: string
  tagline: string
  /** One-line self-selection cue ("For X") rendered above the CTA. */
  forWho: string
  price: PlanPricing
  positioning: string
  ships: ReadonlyArray<string>
  cta: { label: string; href: string; external?: boolean }
  /** Highlights the recommended card on the page (one only). */
  recommended?: boolean
}

/**
 * Plans shown as cards on the page (top three). Enterprise is
 * rendered in its own section (`EnterpriseReady`) and never appears
 * as a card.
 */
export const LICENSE_TYPES: ReadonlyArray<LicenseType> = [
  {
    id: "open-community",
    name: "Community",
    tagline: "Free forever · MIT License",
    forWho:
      "For solo builders, weekend hacks, and open-source projects.",
    price: { kind: "free" },
    positioning:
      "The open-source foundation of DeesseJS. Clean, modular building blocks and essential starters to scaffold your ideas in seconds with zero friction.",
    ships: [
      "1 curated starter template, plus every community-contributed template in the catalog",
      "Permissive MIT License: build personal or commercial apps",
      "Zero vendor lock-in: clean TypeScript ejected straight into your repo",
      "Instant setup via our CLI",
      "Actively maintained and reviewed by the DeesseJS core team",
    ],
    cta: { label: "Browse templates", href: "/templates" },
  },
  {
    id: "professional",
    name: "Professional",
    tagline: "Monthly or annual · Same access either way",
    forWho:
      "For independent developers, freelancers, and engineers who ship to production, including teams pairing with Cursor, Claude Code, and other AI agents.",
    price: {
      kind: "subscription",
      currency: "USD",
      monthly: { amount: 29 },
      annual: { amount: 299 },
    },
    positioning:
      "The complete full-stack architecture engine. Skip weeks of boilerplate glue code and deploy production-ready systems with multi-tenant auth, billing, and automated dashboards.",
    ships: [
      "Access to the full Pro catalog: every current and upcoming Pro template & CLI block",
      "100% full-stack source code ownership: run on your own infrastructure",
      "Unlimited personal and commercial projects (1 developer seat)",
      "Advanced modules: Better-Auth, Stripe/Polar webhooks, RBAC & admin suites",
      "New templates and security patches as long as your subscription is active",
      "14-day money-back guarantee on the first charge, no questions asked",
    ],
    cta: {
      label: "Join now",
      href: "/join/pro",
    },
    recommended: true,
  },
  {
    id: "agency",
    name: "Agency & Team",
    tagline: "Monthly or annual · 5 seats included",
    forWho:
      "For dev agencies, design studios, and engineering teams delivering client work.",
    price: {
      kind: "subscription",
      currency: "USD",
      monthly: { amount: 79 },
      annual: { amount: 799 },
    },
    positioning:
      "Turn your team into a software factory. Build and ship custom, high-margin client applications in days instead of months, backed by full legal resale rights and synchronized design assets.",
    ships: [
      "5 developer seats under a single organization",
      "Extended Commercial License: build and re-sell to clients with zero attribution",
      "Eliminate recurring client platform fees (no mandatory runtime lock-in)",
      "Priority technical support: guaranteed 24h first response on business days",
    ],
    cta: {
      label: "Join as Agency",
      href: "/join/agency",
    },
  },
] as const

/**
 * The three plans that appear as columns in the comparison table.
 * Enterprise sits in its own dedicated section below.
 */
export type ComparisonLayerId = "open-community" | "professional" | "agency"

export type ComparisonStatus = "yes" | "partial" | "no" | "na"

export type ComparisonRow = {
  attribute: string
  /** Short hover explanation for the attribute. Surfaces as a tooltip
   *  next to the attribute name in the comparison table. */
  tooltip?: string
  values: Record<ComparisonLayerId, string>
  /** Optional visual status per tier. Drives the icon next to each
   *  cell. Falls back to a plain text cell when omitted. */
  status?: Record<ComparisonLayerId, ComparisonStatus>
}

export const COMPARISON_LAYERS: ReadonlyArray<{
  id: ComparisonLayerId
  name: string
}> = [
  { id: "open-community", name: "Community" },
  { id: "professional", name: "Professional" },
  { id: "agency", name: "Agency" },
]

/**
 * Comparison rows grouped by intent. Buyers can scan by intent instead
 * of reading a flat list. The "After cancellation" row in Rights &
 * terms reflects the post-cancel reuse policy: projects in
 * production at the time of cancellation stay covered; new projects
 * require a resubscription.
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
        tooltip: "What you pay. All amounts are in USD and include taxes. Switch the cadence toggle at the top of the page to see monthly and annual pricing side by side.",
        values: {
          "open-community": "Free",
          professional: "$29 / month or $299 / year, taxes included",
          agency: "$79 / month or $799 / year, taxes included",
        },
        status: {
          "open-community": "yes",
          professional: "partial",
          agency: "partial",
        },
      },
      {
        attribute: "License",
        tooltip: "The legal terms that come with the templates. MIT = permissive open-source. Professional = commercial subscription for every project you ship while subscribed. Agency = Commercial Extended License: re-sell to your clients without citing DeesseJS.",
        values: {
          "open-community": "MIT",
          professional: "Commercial subscription, every project you ship while subscribed",
          agency: "Commercial Extended License: re-sell to clients, no attribution required",
        },
      },
      {
        attribute: "Source code",
        tooltip: "Whether the underlying source code ships with the plan. Source code lives in your repo, deployable on your infra, with no telemetry or kill switch.",
        values: {
          "open-community": "Included",
          professional: "Included from day one",
          agency: "Included from day one, plus the Figma source file",
        },
      },
      {
        attribute: "Project scope",
        tooltip: "How many projects one subscription covers. No project cap on Professional: every project you ship under the same active subscription, internal or commercial.",
        values: {
          "open-community": "Unlimited",
          professional: "Unlimited. Every project you ship under one active subscription.",
          agency: "Unlimited, across up to 5 developers in your team",
        },
      },
      {
        attribute: "Templates included",
        tooltip: "How many templates your plan unlocks. Open Community ships with a curated starter set; Pro and Agency unlock the full catalog as long as the subscription is active.",
        values: {
          "open-community": "1 starter template",
          professional: "Full Pro catalog, current and new",
          agency: "Full Pro catalog, current and new",
        },
      },
      {
        attribute: "Documentation depth",
        tooltip: "How deep the template-level documentation goes. All plans ship with the same public KB articles; there is no gated documentation by tier.",
        values: {
          "open-community": "Complete",
          professional: "Complete",
          agency: "Complete",
        },
      },
      {
        attribute: "Quality bar",
        tooltip: "What 'done' means for templates in this tier. Open Community = ships end-to-end. Pro = production patterns a CISO expects, audited before release.",
        values: {
          "open-community": "Does it ship end-to-end?",
          professional: "Production patterns a CISO expects",
          agency: "Same as Pro, audited before every release",
        },
        status: {
          "open-community": "partial",
          professional: "yes",
          agency: "yes",
        },
      },
    ],
  },
  {
    heading: "Updates & maintenance",
    rows: [
      {
        attribute: "Updates",
        tooltip: "How often templates are kept current with the ecosystem (Next.js, Better Auth, Drizzle, providers). Community = anyone can PR. Pro and Agency = ongoing maintenance by the team while the subscription is active.",
        values: {
          "open-community": "Community-driven, always current",
          professional: "Ongoing, by the DeesseJS team",
          agency: "Ongoing, by the DeesseJS team, prioritized for client work",
        },
      },
      {
        attribute: "New templates",
        tooltip: "Whether new templates released during your active subscription are added to your access.",
        values: {
          "open-community": "Open to anyone in the catalog",
          professional: "Every new Pro template, included while subscribed",
          agency: "Every new Pro template, included while subscribed",
        },
      },
      {
        attribute: "Security patches",
        tooltip: "Who patches CVEs and security issues when they surface. Pro and Agency = patched by the DeesseJS team as long as the subscription is active.",
        values: {
          "open-community": "Community-driven",
          professional: "Patched by the DeesseJS team, while subscribed",
          agency: "Patched by the DeesseJS team, prioritized over Professional",
        },
      },
    ],
  },
  {
    heading: "Infrastructure & deployment",
    rows: [
      {
        attribute: "Deployment targets",
        tooltip: "Where you can host the templates you ship. All templates are platform-agnostic and run anywhere Node runs.",
        values: {
          "open-community": "Vercel, Netlify, self-host",
          professional: "Vercel, Netlify, AWS, GCP, self-host",
          agency: "Vercel, Netlify, AWS, GCP, self-host",
        },
      },
      {
        attribute: "CI/CD templates",
        tooltip: "Pre-built CI/CD workflows shipped with each template. Open Community has community-contributed ones; Pro and Agency ship curated GitHub Actions files.",
        values: {
          "open-community": "Community-contributed",
          professional: "Curated GitHub Actions",
          agency: "Curated GitHub Actions, plus shared org-level workflows",
        },
      },
    ],
  },
  {
    heading: "Support & community",
    rows: [
      {
        attribute: "Community access",
        tooltip: "Where you can ask questions and follow releases. GitHub Discussions is the primary channel for all tiers.",
        values: {
          "open-community": "GitHub Discussions",
          professional: "GitHub Discussions",
          agency: "GitHub Discussions + private Agency channel",
        },
      },
      {
        attribute: "Email support",
        tooltip: "Direct email channel for support questions. SLAs below are business hours (Monday-Friday, CET).",
        values: {
          "open-community": "Not included",
          professional: "Best effort, 48h first reply",
          agency: "Priority queue, 24h first reply",
        },
        status: {
          "open-community": "no",
          professional: "partial",
          agency: "yes",
        },
      },
      {
        attribute: "Onboarding session",
        tooltip: "Optional call with the DeesseJS team to scope your first project. Available for Professional and Agency.",
        values: {
          "open-community": "Not included",
          professional: "1-hour call, on request",
          agency: "2-hour onboarding + 1-hour review, on request",
        },
        status: {
          "open-community": "no",
          professional: "yes",
          agency: "yes",
        },
      },
    ],
  },
  {
    heading: "Rights & terms",
    rows: [
      {
        attribute: "Refund window",
        tooltip: "How long after your first charge you can request a refund.",
        values: {
          "open-community": "N/A",
          professional: "14 days on the first charge, no questions asked",
          agency: "14 days on the first charge, no questions asked",
        },
        status: {
          "open-community": "na",
          professional: "yes",
          agency: "yes",
        },
      },
      {
        attribute: "Re-sell rights",
        tooltip: "Whether you can resell templates to a client or in another catalog. The Commercial Extended License on Agency explicitly covers re-sale to clients without attribution; Pro covers re-sale to one client at a time while subscribed.",
        values: {
          "open-community": "MIT allows re-use",
          professional: "Re-sell to a client OK while subscribed; unmodified template may not appear in another catalog",
          agency: "Commercial Extended License: re-sell to your clients without citing DeesseJS",
        },
      },
      {
        attribute: "After cancellation",
        tooltip: "What keeps working if you cancel. Projects already in production stay covered; new projects started after cancellation require a resubscription. Code already cloned into your repositories stays there.",
        values: {
          "open-community": "N/A",
          professional: "Projects in production at cancellation stay covered; new projects require a resubscription",
          agency: "Projects in production at cancellation stay covered, including the Figma source; new projects require a resubscription",
        },
        status: {
          "open-community": "na",
          professional: "yes",
          agency: "yes",
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
 * buyers ask about cadence and cancellation first, then licensing
 * rights, then catalog mechanics.
 */
export const PRICING_FAQ_GROUPS: ReadonlyArray<FaqGroup> = [
  {
    heading: "Cadence & cancellation",
    items: [
      {
        question: "What is the difference between monthly and annual?",
        answer:
          "Same access, same catalog, same source code. Annual bills $299 once for the year (saving two months versus monthly). Monthly bills $29 every month, cancel any time.",
      },
      {
        question: "What happens to my templates if I cancel?",
        answer:
          "Projects in production at the time of cancellation stay covered. New projects started after cancellation require a resubscription. Code already cloned into your repositories stays there. Updates and security patches stop landing in your mailbox.",
      },
      {
        question: "Can I resubscribe later?",
        answer:
          "Yes, any time. Resubscribing restores full access to the catalog, updates, and support tier. No penalty, no re-onboarding fee.",
      },
      {
        question: "Do deployed templates stop working when I cancel?",
        answer:
          "No. Projects already in production continue to run. The codebase is yours from day one: no telemetry, no phone-home, no kill switch.",
      },
      {
        question: "Do I still get security patches after cancelling?",
        answer:
          "Only during the active subscription. After cancellation, security patches are not delivered. The codebase you already have is yours to patch yourself if needed.",
      },
      {
        question: "Can I switch between monthly and annual?",
        answer:
          "Yes. You can switch from monthly to annual (the remaining monthly balance is pro-rated against the annual charge), or from annual to monthly (the annual charge is pro-rated against future monthly bills). Switch any time in the billing portal.",
      },
    ],
  },
  {
    heading: "Licensing & re-sell",
    items: [
      {
        question: "How does the Professional license work?",
        answer:
          "A Professional subscription unlocks the full Pro catalog for every project you ship while subscribed. There is no project cap, no per-seat count on a single dev. Source code ships on day one. New templates and security patches land in your access for as long as the subscription is active.",
      },
      {
        question: "Can I re-sell a Professional template to a client?",
        answer:
          "Yes, if you are a freelancer building a client project while subscribed. You may charge the client for the saved time. The unmodified template may not appear in another catalog. For unlimited client work under a single subscription, see Agency & Team.",
      },
      {
        question: "What is the Agency license for?",
        answer:
          "Agency is the same Pro catalog, packaged for agencies and in-house teams of 5-10 developers. It adds three things: Team Access (5 developer seats under one organization key), the Commercial Extended License (re-sell to your clients without citing DeesseJS), and the Figma source file (kept in sync with the TypeScript components).",
      },
      {
        question: "Can I switch between Professional and Agency later?",
        answer:
          "Yes. Contact support and we will pro-rate the time remaining on your existing subscription against the new plan. Moving down (Agency → Professional) does not refund the difference; the team seats and Commercial Extended License stay with you until the end of your paid term.",
      },
    ],
  },
  {
    heading: "Billing & refund",
    items: [
      {
        question: "Why $29 / month for Professional?",
        answer:
          "It's the bottom of the templates-catalog band. The upgrade from Community is meant to be cheap enough that you don't have to justify it internally, under two hours of senior dev time.",
      },
      {
        question: "Why $299 / year for Professional?",
        answer:
          "Annual saves two months versus paying monthly. The annual equivalent is $24.92 / month, well below the cost of one security audit per quarter.",
      },
      {
        question: "Do you have a refund policy?",
        answer:
          "14 days, no questions asked on the first charge. After that, you can cancel any time and keep access until the end of the paid term.",
      },
      {
        question: "Can I try a Professional template before buying?",
        answer:
          "Yes. Community templates share the same architecture as Professional templates. Cloning a Community template gives you a working preview of how Professional templates are structured.",
      },
    ],
  },
  {
    heading: "Templates & roadmap",
    items: [
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
