/**
 * Playbook table of contents.
 *
 * Single source for the chapter list shown in the "What you'll
 * find" section. Each entry carries three pieces of copy that
 * map directly to the three slots in a ForWho-style cell:
 *   - eyebrow: a short label shown above the title
 *   - takeaway: the verb-first outcome the chapter delivers
 *   - body: a one-paragraph description of what the chapter covers
 *
 * All three fields are placeholder copy pending the real PDF.
 * The `id` is kept as a stable React key and matches the order
 * in the source list, but it is not rendered (the eyebrow
 * replaces the visible chapter number).
 *
 * TODO(v0.2): before the PR moves out of draft, replace the
 * placeholder copy with chapter content drawn from the real
 * TOC and link each entry to a corresponding preview image in
 * `apps/web/public/playbook/preview/` (one PNG per chapter).
 */
export interface TocEntry {
  /** Stable key for React; matches the order in the source list. */
  id: string
  /** Short label shown above the title (e.g. "Before you prompt"). */
  eyebrow: string
  /** Verb-first takeaway phrased as a capability. */
  takeaway: string
  /** One-paragraph description of what the chapter covers. */
  body: string
}

export const PLAYBOOK_TOC: ReadonlyArray<TocEntry> = [
  {
    id: "01",
    eyebrow: "Before you prompt",
    takeaway: "Recognize the decisions an agent silently makes for you",
    body: "Why the choices the agent makes on your behalf are usually invisible until they bite, and what to do about it before you press send.",
  },
  {
    id: "02",
    eyebrow: "Briefs that work",
    takeaway:
      "Shape a task before you send it: what to fix, what to leave alone",
    body: "How to write a task the agent can actually execute, and the parts of your codebase you should keep out of its reach on the first pass.",
  },
  {
    id: "03",
    eyebrow: "Foundations",
    takeaway:
      "Set up the project foundations the agent will build on, once",
    body: "The structure you lay down once so every future agent run inherits the same conventions, the same scripts, and the same contracts without you re-explaining them.",
  },
  {
    id: "04",
    eyebrow: "Boundaries",
    takeaway:
      "Draw clean boundaries between components so the agent's edits stay local",
    body: "Where to put the seams, why they matter, and how the agent's blast radius shrinks to a single file when the boundaries hold.",
  },
  {
    id: "05",
    eyebrow: "Verification",
    takeaway: "Verify the work, beyond a green CI, beyond 'it ran'",
    body: "The checks that catch the regressions a passing test suite doesn't, and how to wire them in without slowing the agent down to a crawl.",
  },
  {
    id: "06",
    eyebrow: "Handoff",
    takeaway:
      "Hand off: what to document so the next person (human or agent) can pick it up",
    body: "The notes you leave for the next reader, the contracts that survive a swap, and the README that ages well instead of rotting on day one.",
  },
] as const

/**
 * Cover-line summary used in the H1 lead. Kept separate from the TOC
 * so the lead can stay short while the TOC carries detail.
 */
export const PLAYBOOK_LEAD =
  "A working guide for developers who ship with coding agents and want their software to stay readable, testable, and maintainable."
