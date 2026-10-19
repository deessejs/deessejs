/**
 * Playbook table of contents.
 *
 * Single source for the chapter list shown in the "What you'll find"
 * section. Each entry is intentionally short: a one-line takeaway
 * rather than a chapter title, so the visible copy stays scannable
 * while the PDF itself carries the full chapter titles.
 *
 * TODO(v0.2): before the PR moves out of draft, replace the
 * placeholder copy with chapter titles drawn from the real TOC and
 * link each entry to a corresponding preview image in
 * `apps/web/public/playbook/preview/` (one PNG per chapter).
 */
export interface TocEntry {
  /** Stable key for React; matches the order in the source list. */
  id: string
  /** One-line takeaway phrased as a verb-first capability. */
  takeaway: string
}

export const PLAYBOOK_TOC: ReadonlyArray<TocEntry> = [
  {
    id: "01",
    takeaway: "Recognize the decisions an agent silently makes for you",
  },
  {
    id: "02",
    takeaway:
      "Shape a task before you send it: what to fix, what to leave alone",
  },
  {
    id: "03",
    takeaway:
      "Set up the project foundations the agent will build on, once",
  },
  {
    id: "04",
    takeaway:
      "Draw clean boundaries between components so the agent's edits stay local",
  },
  {
    id: "05",
    takeaway:
      "Verify the work, beyond a green CI, beyond 'it ran'",
  },
  {
    id: "06",
    takeaway:
      "Hand off: what to document so the next person (human or agent) can pick it up",
  },
] as const

/**
 * Cover-line summary used in the H1 lead. Kept separate from the TOC
 * so the lead can stay short while the TOC carries detail.
 */
export const PLAYBOOK_LEAD =
  "A working guide for developers who ship with coding agents and want their software to stay readable, testable, and maintainable."
