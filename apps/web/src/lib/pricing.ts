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
 *   1. Community — MIT, free, community-driven. No license to manage.
 *   2. Professional — $299 one-shot, lifetime, every project you ship.
 *      Source code shipped on day one. Pair with Subscription for updates.
 *   3. Agency & Team — $799 one-shot, 5 seats, Commercial Extended License.
 *      For dev agencies, design studios, and engineering teams.
 *   4. Subscription — $23/month, ongoing access to updates and new
 *      templates. Optional, on top of a Professional license. Cancel any
 *      time — what you've already cloned stays usable.
 *
 * Adding a new license type or changing prices means:
 *   1. Update the strategy doc first.
 *   2. Mirror the change here.
 *   3. Update the comparison table in the page.
 */

export type LicenseTypeId =
  | "open-community"
  | "professional"
  | "agency"
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
 * Professional and Subscription are two parts of the same Pro offer:
 * the Professional license unlocks the codebase once, the Subscription
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
    tagline: "One-time payment · Lifetime access",
    forWho:
      "For independent developers, freelancers, and engineers who ship to production — including teams pairing with Cursor, Claude Code, and other AI agents.",
    price: { kind: "fixed", amount: 299, currency: "USD" },
    positioning:
      "The complete full-stack architecture engine. Skip weeks of boilerplate glue code and deploy production-ready systems with multi-tenant auth, billing, and automated dashboards.",
    ships: [
      "Lifetime access to all current and upcoming Pro templates & CLI blocks",
      "100% full-stack source code ownership: run on your own infrastructure",
      "Unlimited personal and commercial projects (1 developer seat)",
      "Advanced modules: Better-Auth, Stripe/Polar webhooks, RBAC & admin suites",
      "Agent-ready: every template ships with an MCP manifest and AGENTS.md for Cursor, Claude Code, and Windsurf",
      "Access to private registry updates and ongoing security patches",
      "14-day money-back guarantee, no questions asked",
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
    tagline: "One-time payment · 5 seats included",
    forWho:
      "For dev agencies, design studios, and engineering teams delivering client work.",
    price: { kind: "fixed", amount: 799, currency: "USD" },
    positioning:
      "Turn your team into a software factory. Build and ship custom, high-margin client applications in days instead of months, backed by full legal resale rights and synchronized design assets.",
    ships: [
      "5 developer seats managed under a single organization API key",
      "Extended Commercial License: build and re-sell to clients with zero attribution",
      "Eliminate recurring client platform fees (no mandatory runtime lock-in)",
      "Priority technical support: guaranteed 24h first response on business days",
    ],
    cta: {
      label: "Join as Agency",
      href: "/join/agency",
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
 * table. Agency sits between Professional and the implicit subscription
 * banner — the subscription does not appear as a comparison column.
 */
export type ComparisonLayerId =
  | "open-community"
  | "professional"
  | "agency"

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
 * of reading a flat list. The "Post-cancellation" row in Rights &
 * terms reflects the Professional + Subscription split: what you keep
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
        tooltip: "What you pay upfront. One-shot = single payment, lifetime access.",
        values: {
          "open-community": "Free",
          "professional": "$299 one-shot, every project you ship",
          agency: "$799 one-shot, 5 seats, re-sell to your clients",
        },
        status: {
          "open-community": "yes",
          "professional": "partial",
          agency: "partial",
        },
      },
      {
        attribute: "License",
        tooltip: "The legal terms that come with the templates. MIT = permissive open-source. Professional = lifetime commercial use of every project you ship under one license. Agency = Commercial Extended License: re-sell to your clients without citing DeesseJS.",
        values: {
          "open-community": "MIT",
          "professional": "Lifetime, every project you ship, no cap",
          agency: "Commercial Extended License: re-sell to clients, no attribution required",
        },
      },
      {
        attribute: "Source code",
        tooltip: "Whether the underlying source code ships with the license. Source code lives in your repo, deployable on your infra, with no telemetry or kill switch.",
        values: {
          "open-community": "Included",
          "professional": "Included on day one",
          agency: "Included on day one, plus the Figma source file",
        },
      },
      {
        attribute: "Project scope",
        tooltip: "How many projects one license covers. No cap on Professional: every project you ship under the same license, internal or commercial.",
        values: {
          "open-community": "Unlimited",
          "professional": "Unlimited. Every project you ship under one license.",
          agency: "Unlimited, across up to 5 developers in your team",
        },
      },
      {
        attribute: "Templates included",
        tooltip: "How many templates your license unlocks at any given time. Open Community ships with a curated starter set; Pro and Agency unlock the full catalog at the time of purchase.",
        values: {
          "open-community": "1 starter template",
          "professional": "30+ templates at purchase",
          agency: "30+ templates at purchase",
        },
      },
      {
        attribute: "MCP server",
        tooltip: "Every Pro template ships with an MCP manifest that exposes its tools to coding agents. Open Community templates are catalog-only.",
        values: {
          "open-community": "Not included",
          "professional": "Included",
          agency: "Included, with shared organization auth",
        },
        status: {
          "open-community": "no",
          "professional": "yes",
          agency: "yes",
        },
      },
      {
        attribute: "AGENTS.md in templates",
        tooltip: "Every Pro template ships with an AGENTS.md at the repo root describing how an AI agent should navigate the codebase. Open Community templates rely on the maintainer's contribution.",
        values: {
          "open-community": "Maintainer-dependent",
          "professional": "Every template",
          agency: "Every template, plus shared conventions for multi-seat teams",
        },
        status: {
          "open-community": "partial",
          "professional": "yes",
          agency: "yes",
        },
      },
      {
        attribute: "Documentation depth",
        tooltip: "How deep the template-level documentation goes. Pro templates include a per-template KB article in addition to the README.",
        values: {
          "open-community": "README only",
          "professional": "README + KB article",
          agency: "README + KB article + design specs (Figma source)",
        },
      },
      {
        attribute: "Submission flow",
        tooltip: "How templates enter the catalog. Pull-request = community contribution, reviewed by a DeesseJS maintainer. Authored by the team = curated production-grade.",
        values: {
          "open-community": "Pull-request",
          "professional": "Authored by the DeesseJS team",
          agency: "Authored by the DeesseJS team",
        },
      },
      {
        attribute: "Quality bar",
        tooltip: "What 'done' means for templates in this tier. Open Community = ships end-to-end. Pro = production patterns a CISO expects, audited before release.",
        values: {
          "open-community": "Does it ship end-to-end?",
          "professional": "Production patterns a CISO expects",
          agency: "Same as Pro, audited before every release",
        },
        status: {
          "open-community": "partial",
          "professional": "yes",
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
        tooltip: "How often templates are kept current with the ecosystem (Next.js, Better Auth, Drizzle, providers). Community = anyone can PR. Pro and Agency = ongoing maintenance by the team.",
        values: {
          "open-community": "Community-driven, always current",
          "professional": "Ongoing, by the DeesseJS team",
          agency: "Ongoing, by the DeesseJS team, prioritized for client work",
        },
      },
      {
        attribute: "New templates",
        tooltip: "Whether new templates released during your license term are added to your access.",
        values: {
          "open-community": "Open to anyone in the catalog",
          "professional": "Every new Pro template, included at no extra cost",
          agency: "Every new Pro template, included at no extra cost",
        },
      },
      {
        attribute: "Security patches",
        tooltip: "Who patches CVEs and security issues when they surface. Pro and Agency = patched by the DeesseJS team as part of the license.",
        values: {
          "open-community": "Community-driven",
          "professional": "Patched by the DeesseJS team",
          agency: "Patched by the DeesseJS team, prioritized over Professional",
        },
      },
      {
        attribute: "Roadmap visibility",
        tooltip: "Whether you can see what the DeesseJS team is building next. Public roadmap = what's shipping in the catalog. Private roadmap = unreleased work-in-progress.",
        values: {
          "open-community": "Public, read-only",
          "professional": "Public + private backlog",
          agency: "Public + private backlog, comments enabled",
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
          "professional": "Vercel, Netlify, AWS, GCP, self-host",
          agency: "Vercel, Netlify, AWS, GCP, self-host",
        },
      },
      {
        attribute: "Custom domain",
        tooltip: "Whether you can serve your deployed template under your own domain. Configuration is environment-driven, no vendor lock-in.",
        values: {
          "open-community": "Supported",
          "professional": "Supported",
          agency: "Supported, with white-label client deployments",
        },
      },
      {
        attribute: "CI/CD templates",
        tooltip: "Pre-built CI/CD workflows shipped with each template. Open Community has community-contributed ones; Pro and Agency ship curated GitHub Actions files.",
        values: {
          "open-community": "Community-contributed",
          "professional": "Curated GitHub Actions",
          agency: "Curated GitHub Actions, plus shared org-level workflows",
        },
      },
      {
        attribute: "Observability hooks",
        tooltip: "OpenTelemetry hooks baked into every Pro template. Open Community templates ship without a default observability stack.",
        values: {
          "open-community": "Bring your own",
          "professional": "OTel-ready, vendor-agnostic",
          agency: "OTel-ready, vendor-agnostic, shared org dashboard templates",
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
          "professional": "GitHub Discussions",
          agency: "GitHub Discussions + private Agency channel",
        },
      },
      {
        attribute: "Email support",
        tooltip: "Direct email channel for support questions. SLAs below are business hours (Monday-Friday, CET).",
        values: {
          "open-community": "Not included",
          "professional": "Best effort, 48h first reply",
          agency: "Priority queue, 24h first reply",
        },
        status: {
          "open-community": "no",
          "professional": "partial",
          agency: "yes",
        },
      },
      {
        attribute: "Onboarding session",
        tooltip: "Optional call with the DeesseJS team to scope your first project. Available for Professional and Agency.",
        values: {
          "open-community": "Not included",
          "professional": "1-hour call, on request",
          agency: "2-hour onboarding + 1-hour review, on request",
        },
        status: {
          "open-community": "no",
          "professional": "yes",
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
        tooltip: "How long after purchase you can request a refund.",
        values: {
          "open-community": "N/A",
          "professional": "14 days, no questions asked",
          agency: "14 days, no questions asked",
        },
        status: {
          "open-community": "na",
          "professional": "yes",
          agency: "yes",
        },
      },
      {
        attribute: "Re-sell rights",
        tooltip: "Whether you can resell templates to a client or in another catalog. The Commercial Extended License on Agency explicitly covers re-sale to clients without attribution; Pro covers re-sale to one client at a time.",
        values: {
          "open-community": "MIT allows re-use",
          "professional": "Re-sell to a client OK; unmodified template may not appear in another catalog",
          agency: "Commercial Extended License: re-sell to your clients without citing DeesseJS",
        },
      },
      {
        attribute: "Post-cancellation",
        tooltip: "What keeps working if you walk away from a one-shot. Both Pro and Agency grant lifetime access to the codebase you already have.",
        values: {
          "open-community": "N/A",
          "professional": "What you've already cloned stays usable forever",
          agency: "What you've already cloned stays usable forever, including the Figma source",
        },
        status: {
          "open-community": "na",
          "professional": "yes",
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
 * buyers ask about licensing and post-cancellation first, then billing,
 * then catalog mechanics.
 */
export const PRICING_FAQ_GROUPS: ReadonlyArray<FaqGroup> = [
  {
    heading: "Licensing & re-sell",
    items: [
      {
        question: "How does the Professional license work?",
        answer:
          "One Professional license unlocks the codebase across every project you ship. There is no project cap, no per-seat count on a single dev. Add a Subscription on top to keep the codebase current as the DeesseJS team ships new templates and security patches.",
      },
      {
        question: "Can I re-sell a Professional template to a client?",
        answer:
          "Yes, if you are a freelancer building a client project. You may charge the client for the saved time. The unmodified template may not appear in another catalog. For unlimited client work under a single license, see Agency & Team.",
      },
      {
        question: "How does Pro Education verification work?",
        answer:
          "Send a .edu email or equivalent proof (student card, school-issued document) to support@deessejs.com. For OSS projects, link the repo where you are a maintainer. The license is bound to the verified buyer or project and may not be transferred to a non-OSS third party.",
      },
      {
        question: "Can I switch a template between license types?",
        answer:
          "Open Community and Pro Education share the same templates under different license terms. Moving from one to the other is just a verification step. The Professional license and the Subscription are two parts of the same Pro offer, not an upgrade path between them.",
      },
      {
        question: "What is the Agency license for?",
        answer:
          "Agency is the same Pro catalog, packaged for agencies and in-house teams of 5-10 developers. It adds three things: Team Access (5 developer seats under one organization key, so the whole team shares the same CLI auth), the Commercial Extended License (you can re-sell to your clients without citing DeesseJS), and the Figma source file (kept in sync with the TypeScript components, so designers start from the same primitives).",
      },
      {
        question: "Can I switch between Professional and Agency later?",
        answer:
          "Yes. The Professional and Agency one-shots are priced so the upgrade from Professional to Agency is the difference between the two prices — contact support and we'll pro-rate the time remaining on your existing license against the Agency price. Moving down (Agency → Professional) does not refund the difference; the agency seats and Commercial Extended License stay with you until the end of your paid term.",
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
        question: "What is the difference between Professional and the Subscription?",
        answer:
          "None on what you get. Both unlock the full Pro catalog, source code access, and every new template. The only difference is the payment cadence: Professional is $299 paid once, the Subscription is $23 paid every month. Pick the cadence that fits your cash flow.",
      },
      {
        question: "Can I switch from one to the other?",
        answer:
          "Yes. You can switch from Professional to the Subscription (your Professional payment is pro-rated against future subscription months), or from the Subscription to Professional (your subscription months are pro-rated against the $299). Switch any time in the billing portal.",
      },
      {
        question: "Why $299 for Professional?",
        answer:
          "It's the bottom of the templates-catalog band. The upgrade from Community is meant to be cheap enough that you don't have to justify it internally, under two hours of senior dev time.",
      },
      {
        question: "Why $23 / month for the Subscription?",
        answer:
          "It's the floor of the templates-subscription band. Comparable to one senior dev hour per month, and well below the cost of one security audit per quarter. The annual equivalent ($276) is also less than $299, which is the point.",
      },
      {
        question: "Do you have a refund policy?",
        answer:
          "14 days, no questions asked on the Professional payment. The Subscription is pro-rated and self-serve in the billing portal.",
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
        question: "Why license types and not tiers?",
        answer:
          "A Professional license and a Subscription are not tiers of the same product, they're two parts of the same offer. Conflating them would force a buyer to choose between owning the code and staying current; the model lets them have both, or either.",
      },
      {
        question: "Which stacks does Professional cover?",
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
