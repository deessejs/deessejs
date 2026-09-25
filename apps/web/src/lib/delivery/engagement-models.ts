/**
 * Three engagement formats for the /delivery page.
 *
 * Three packaged offerings rather than an open-ended "we do custom
 * work. Gives a buyer an immediate sense of where they fit.
 * Sprint Kickstart (2 weeks) for founders with a deadline.
 * Custom Enterprise (3-5 weeks) for SMBs with complex domain
 * logic. Embedded (monthly) for in-house teams that need a
 * Staff Engineer supplement without the hire.
 */
export type EngagementModel = {
  id: "sprint-kickstart" | "custom-enterprise" | "embedded"
  /** Packaged product name, sentence case. Rides at the top of the card. */
  name: string
  /** Short duration label. */
  duration: string
  /** Who this engagement is built for. */
  audience: string
  /** What the team does during the engagement. */
  scope: string
  /** What the buyer walks away with. */
  deliverable: string
}

export const ENGAGEMENT_MODELS: ReadonlyArray<EngagementModel> = [
  {
    id: "sprint-kickstart",
    name: "Sprint Kickstart",
    duration: "2 weeks",
    audience:
      "Founders under deadline, startups raising, and teams launching a new product.",
    scope:
      "Deploy a Pro template (SaaS, E-commerce, or Top-of-Funnel) adapted to your brand, integrate your custom database schema, wire auth and Stripe, and deploy directly to your cloud provider.",
    deliverable:
      "Complete production MVP, ready for your first users.",
  },
  {
    id: "custom-enterprise",
    name: "Custom Architecture",
    duration: "3 to 5 weeks",
    audience:
      "Mid-market and enterprise teams with complex domain logic.",
    scope:
      "Architect custom data models, integrate your internal APIs and legacy systems, configure advanced multi-tenant RBAC, build administrative dashboards, and wire OpenTelemetry instrumentation.",
    deliverable:
      "High-scale application fully integrated into your existing infrastructure.",
  },
  {
    id: "embedded",
    name: "Embedded Staff Engineer",
    duration: "Monthly Retainer",
    audience:
      "In-house engineering teams that need a Staff-level force multiplier.",
    scope:
      "Direct presence in your Slack, weekly code reviews, architectural arbitration, and proprietary DeesseJS CLI blocks built specifically for your internal workflows.",
    deliverable:
      "Continuous team reinforcement, without the 6-month hiring cycle.",
  },
]
