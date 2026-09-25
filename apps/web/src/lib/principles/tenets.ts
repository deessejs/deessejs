/**
 * /principles — nine operating tenets.
 *
 * Each principle is a numbered entry (Roman numerals I.–IX., kept
 * as text rather than auto-generated so we control typography and
 * can reorder without renumbering), a short title, and one
 * paragraph. The full set complements /manifesto (philosophy)
 * with the day-to-day operational rules.
 */
export type Principle = {
  number: string
  title: string
  body: string
}

export const PRINCIPLES: ReadonlyArray<Principle> = [
  {
    number: "I.",
    title: "Ship the smallest useful thing",
    body:
      "Every release answers one question. We cut scope until the remaining change is small enough to merge with full attention. The roadmap stays public so users see what's next and what's intentionally not yet.",
  },
  {
    number: "II.",
    title: "Public by default",
    body:
      "Specs, decisions, and tradeoffs live in the open. We document in the file, not in a wiki. Decisions are recorded in the docs they affect, with their context, so a future reader can rebuild the choice from first principles.",
  },
  {
    number: "III.",
    title: "Two-way door first",
    body:
      "Reversible changes ship fast. Irreversible ones earn design docs, second reviews, and a runbook. We bias toward options we can walk back from, and we name the few we cannot.",
  },
  {
    number: "IV.",
    title: "Templates are test fixtures",
    body:
      "Every DeesseJS template is built once, smoke-tested, versioned, and reused. If a template needs custom logic that doesn't generalize, it stays a private fork. The registry earns its name by curating what survives contact with production.",
  },
  {
    number: "V.",
    title: "The CLI is the contract",
    body:
      "Anything users do often lives in the CLI. The web surface explains; the terminal ships. When the two diverge, the terminal wins. That's where time accumulates.",
  },
  {
    number: "VI.",
    title: "Modular before clever",
    body:
      "We split until each file has one job, then we stop. Reusable primitives live in packages/* with their own tests, their own version, their own release cadence. Cross-package coupling is a smell.",
  },
  {
    number: "VII.",
    title: "Defaults over configuration",
    body:
      "We ship defaults that work for 80% of cases. Configuration exists for the 20%; we don't apologize for hiding it under a flag. Every option we expose is a future option someone has to maintain.",
  },
  {
    number: "VIII.",
    title: "Observability is a feature",
    body:
      "If we can't see it, we can't ship it. Logs, traces, and metrics land with the feature, not after. Internal tools get the same telemetry treatment as user-facing ones.",
  },
  {
    number: "IX.",
    title: "Pause before adding",
    body:
      "We add things on purpose. The default answer to a new dependency, a new endpoint, a new env var, a new product surface is *not yet*. If the case grows louder after a week of waiting, we revisit. Otherwise, we let it go.",
  },
] as const
