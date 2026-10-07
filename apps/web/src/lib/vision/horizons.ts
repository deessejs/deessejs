/**
 * /vision — three horizons.
 *
 * Now / Next / Beyond. Each horizon has a label, a status string
 * (rendered as a Badge), a one-line tagline, and an ordered set of
 * items that describe what fits under that horizon. The literal
 * union on `label` and `status` keeps typos out of the section
 * component.
 */
export type HorizonItem = {
  title: string
  description: string
  /**
   * Render the description inside a `<blockquote>` pull-quote
   * with a 4px primary left-border instead of a plain <p>.
   * Use sparingly — at most one per horizon, so the
   * rhetorical device stays weighted.
   */
  pullQuote?: boolean
}

export type Horizon = {
  label: "Now" | "Next" | "Beyond"
  status: "Shipping today" | "In flight this quarter" | "Aspirational"
  tagline: string
  items: ReadonlyArray<HorizonItem>
}

export const HORIZONS: ReadonlyArray<Horizon> = [
  {
    label: "Now",
    status: "Shipping today",
    tagline:
      "What you can pull from the registry and the CLI today.",
    items: [
      {
        title: "Curated template registry",
        description:
          "Templates covering SaaS, AI, and landing surfaces, each contract-validated against @workspace/contracts before publish.",
      },
      {
        title: "End-to-end stack defaults",
        description:
          "Next.js, Better Auth, Drizzle, shadcn/ui, Tailwind v4. Wired and ready to run on day one.",
      },
      {
        title: "Public CLI with offline cache",
        description:
          "deessejs init / list / info. Works offline, ships with retry and a local ETag-keyed cache.",
      },
      {
        title: "ISR-backed marketing surfaces",
        description:
          "The marketing site renders the catalog server-side, contract-validated, with tag-based revalidation.",
      },
    ],
  },
  {
    label: "Next",
    status: "In flight this quarter",
    tagline:
      "What we are actively building toward. Subject to revision.",
    items: [
      {
        title: "Agent-aware template metadata",
        description:
          "Each template carries machine-readable capabilities, compatible agents, and install hints, so a coding agent can pick and run one without human nudging.",
      },
      {
        title: "Categories + frameworks filter",
        description:
          "The catalog becomes browsable by type and by framework, with multi-select URL state and per-template counts.",
      },
      {
        title: "Multi-tenant auth as a first-class package",
        description:
          "An opt-in package that brings row-level multi-tenancy to new templates without rewiring the auth flow.",
      },
      {
        title: "Vercel preview + CI",
        description:
          "Every PR runs lint, typecheck, unit tests, integration tests, and a Vercel preview deploy. Merges are gated green.",
      },
    ],
  },
  {
    label: "Beyond",
    status: "Aspirational",
    tagline:
      "Where we are heading if everything else goes well. No dates.",
    items: [
      {
        title: "Templates that ship themselves",
        description:
          "An agent reviews the diff, runs the smoke tests, opens the PR, and waits on a human reviewer for sign-off. We write the reviewers.",
        pullQuote: true,
      },
      {
        title: "A registry as a marketplace",
        description:
          "Authors ship templates through the same registry we use ourselves. Opinionated defaults, versioned, contract-tested. Discovery, install, and update all in one tool.",
      },
      {
        title: "Composable primitives, not stacks",
        description:
          "Stop shipping monoliths. Users pull packages (auth, db, payments, observability) individually, with templates that demonstrate how they fit together.",
      },
      {
        title: "Agent observability as a first-class concern",
        description:
          "The traces, logs, and metrics of an AI agent running your stack are observable by default. We treat the agent as a first-class actor in the system, not a side effect.",
      },
    ],
  },
] as const
