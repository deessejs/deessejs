/** The approved public offer. Price details are operator configured. */
export type LicenseTypeId = "open-community" | "pro"

export type LicenseType = {
  id: LicenseTypeId
  name: string
  tagline: string
  forWho: string
  price: { kind: "free" } | { kind: "seat-based" }
  positioning: string
  ships: ReadonlyArray<string>
  cta: { label: string; href: string; external?: boolean }
  recommended?: boolean
}

export const LICENSE_TYPES: ReadonlyArray<LicenseType> = [
  {
    id: "open-community",
    name: "Community",
    tagline: "Free · MIT License",
    forWho: "For anyone building with the open DeesseJS foundation.",
    price: { kind: "free" },
    positioning:
      "Start with the community catalog and build on an open foundation.",
    ships: [
      "Community templates and public documentation",
      "MIT licensed for personal and commercial projects",
      "Source code you can run on your own infrastructure",
    ],
    cta: { label: "Browse templates", href: "/templates" },
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "One plan · Priced by developer seat",
    forWho: "For individual developers and teams that need the full catalog.",
    price: { kind: "seat-based" },
    positioning:
      "Get the same Pro features and commercial-use rights for every assigned developer seat.",
    ships: [
      "Full Pro catalog and included updates while subscribed",
      "One developer seat for each assigned organization member",
      "Commercial use, including client work, on every Pro seat",
    ],
    cta: { label: "Get Pro", href: "/organizations?intent=pro" },
    recommended: true,
  },
] as const

export type ComparisonLayerId = "open-community" | "pro"
export type ComparisonStatus = "yes" | "partial" | "no" | "na"
export type ComparisonRow = {
  attribute: string
  tooltip?: string
  values: Record<ComparisonLayerId, string>
  status?: Record<ComparisonLayerId, ComparisonStatus>
}
export type ComparisonGroup = {
  heading: string
  rows: ReadonlyArray<ComparisonRow>
}

export const COMPARISON_LAYERS: ReadonlyArray<{
  id: ComparisonLayerId
  name: string
}> = [
  { id: "open-community", name: "Community" },
  { id: "pro", name: "Pro" },
]

export const COMPARISON_GROUPS: ReadonlyArray<ComparisonGroup> = [
  {
    heading: "Access",
    rows: [
      {
        attribute: "Price",
        values: { "open-community": "Free", pro: "Per developer seat" },
      },
      {
        attribute: "Catalog",
        values: {
          "open-community": "Community catalog",
          pro: "Full Pro catalog",
        },
      },
      {
        attribute: "Updates",
        values: {
          "open-community": "Community maintained",
          pro: "Included while subscribed",
        },
      },
      {
        attribute: "Seats",
        values: {
          "open-community": "Not applicable",
          pro: "Assign seats to organization members",
        },
      },
    ],
  },
  {
    heading: "Rights",
    rows: [
      {
        attribute: "License",
        values: {
          "open-community": "MIT",
          pro: "Same commercial-use rights on every seat",
        },
      },
      {
        attribute: "Client work",
        values: {
          "open-community": "Allowed under MIT",
          pro: "Included on every Pro seat",
        },
      },
      {
        attribute: "Team size",
        values: {
          "open-community": "No paid seats",
          pro: "Buy the number of seats you need",
        },
      },
    ],
  },
]

export type FaqItem = { question: string; answer: string }
export type FaqGroup = { heading: string; items: ReadonlyArray<FaqItem> }

export const PRICING_FAQ_GROUPS: ReadonlyArray<FaqGroup> = [
  {
    heading: "Plans and access",
    items: [
      {
        question: "Is Community free?",
        answer:
          "Yes. Community remains free and is available under the MIT license.",
      },
      {
        question: "How is Pro priced?",
        answer:
          "Pro is one subscription priced by developer seat. Exact prices, currency, and tax treatment have not been announced.",
      },
      {
        question: "Can I use Pro for client work?",
        answer:
          "Yes. Every Pro seat has the same features and commercial-use rights, including client work. There is no agency surcharge.",
      },
      {
        question: "How do seats work?",
        answer:
          "An organization owner or admin purchases capacity and assigns seats to organization members. Only members with an assigned seat receive Pro access.",
      },
      {
        question: "Do you offer annual billing?",
        answer:
          "Annual billing is not currently offered. We will show it when the billing configuration supports it.",
      },
    ],
  },
  {
    heading: "Organizations and billing",
    items: [
      {
        question: "Do I need an organization?",
        answer:
          "Yes. Pro subscriptions belong to an organization. You can create one or select one after signing in.",
      },
      {
        question: "Who can manage billing?",
        answer:
          "Only organization owners and admins can start or manage a subscription.",
      },
      {
        question: "What is Enterprise?",
        answer:
          "Contact us for genuinely custom procurement, support, or security requirements. Enterprise is not required to buy more seats.",
      },
      {
        question: "What happens if Stripe is unavailable?",
        answer:
          "The billing page explains when billing is not configured or cannot be reached. Your Community access remains available.",
      },
    ],
  },
] as const

export const PRICING_FAQ: ReadonlyArray<FaqItem> = PRICING_FAQ_GROUPS.flatMap(
  (group) => group.items
)
