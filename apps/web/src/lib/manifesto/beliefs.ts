/**
 * /manifesto — six beliefs.
 *
 * Numbered manifesto: each belief gets a two-digit number ("01"–
 * "06"), a title, and a paragraph. The numeric prefix is rendered
 * in a mono span next to the title in the section component;
 * keeping it as part of the data rather than auto-generated means
 * we can reorder or omit items without renumbering every entry.
 */
export type Belief = {
  number: string
  title: string
  body: string
}

export const BELIEFS: ReadonlyArray<Belief> = [
  {
    number: "01",
    title: "Agents are the developers now",
    body: "The next platform shift is autonomous agents shipping production code. Templates should be shaped for the agents that ship them: clear boundaries, machine-readable metadata, hooks over conventions. If a template can't be navigated by a coding agent, it isn't done.",
  },
  {
    number: "02",
    title: "Opinionated defaults, modular everything",
    body: "We pick the stack: Next.js, Better Auth, Drizzle, shadcn/ui, Tailwind v4, and we ship it wired. Every primitive is removable without breaking the rest. The opinions give speed; the modularity gives longevity.",
  },
  {
    number: "03",
    title: "Speed is the feature",
    body: "A good template lands in minutes, debugged in seconds, understood in a single read. We treat every file that survived PR review as a place where someone will live for the next three years. Documentation in the file beats documentation in a wiki.",
  },
  {
    number: "04",
    title: "The CLI is the product surface",
    body: "A discoverable, composable CLI (`deessejs init`, `deessejs list`, `deessejs update`) is how developers adopt a system. We invest in the terminal because that's where the time adds up. The web surface is where humans browse; the CLI is where they ship.",
  },
  {
    number: "05",
    title: "Open source, with guardrails",
    body: "DeesseJS templates, contracts, and the CLI are MIT. The brand, the marketplace positioning, and the curated registry stay ours. The source-code ecosystem is shared; the product surface is owned.",
  },
  {
    number: "06",
    title: "Ship the smallest useful thing",
    body: "We don't wait for the full vision to release the first slice. Templates, the registry, the SDK: they land as they become useful, and they evolve in the open. The roadmap is a public draft. The community is part of how we build, not who we build for.",
  },
] as const
