import { Section } from "@/components/marketing/section"

interface AudienceEntry {
  /** Stable key for React; matches the order in the source list. */
  id: string
  /** Short descriptor above the takeaway. */
  eyebrow: string
  /** Verb-first takeaway, phrased as a statement about the reader. */
  takeaway: string
  /** One-paragraph description of what the trait looks like. */
  body: string
}

/**
 * Three reader profiles, in the same data shape as
 * `content/toc.ts` (eyebrow + takeaway + body). Placeholder
 * copy pending real audience research.
 */
const AUDIENCE: ReadonlyArray<AudienceEntry> = [
  {
    id: "a",
    eyebrow: "Still in the code",
    takeaway: "You write code today; you expect to keep doing so.",
    body: "You ship the work, not just review it. The playbook assumes you read the diff and you own the result.",
  },
  {
    id: "b",
    eyebrow: "Briefs, not magic",
    takeaway:
      "You treat agents as a fast junior who needs clear briefs.",
    body: "The agent is a collaborator who needs a clear task description, not a replacement for engineering judgement. You write the brief and the agent does the typing.",
  },
  {
    id: "c",
    eyebrow: "Software that ages",
    takeaway: "You care about what the codebase looks like next month.",
    body: "You optimise for the codebase you will read next month, not just the demo that runs today. Testability, readability, and clean seams are part of the deliverable.",
  },
] as const

/**
 * /playbook "Who it's for" section.
 *
 * Same recipe as the homepage's ForWho and the playbook's own
 * "What you'll find" section: `<Section>` is the grid container,
 * the header spans all three columns with eyebrow + h2 +
 * description, the three cells are plain divs with ForWho's
 * label + h3 + body typography. No Card primitive, no rounded
 * corners, transparent background, no per-cell "Learn more" link.
 *
 * The body carries `pb-6` to provide the bottom padding that
 * ForWho gets from its "Learn more" link, which is intentionally
 * absent here.
 */
export function WhoItsFor() {
  return (
    <Section className="grid grid-cols-1 md:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x divide-border">
      <div className="flex flex-col col-span-1 md:col-span-3 border-0">
        <div className="flex flex-col gap-2 p-6 border-b border-border">
          <p className="text-label-13 text-muted-foreground">
            Who it&apos;s for
          </p>
          <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
            You build with agents today
          </h2>
          <p className="text-copy-16 text-muted-foreground leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
            You already use Claude Code, Codex, Cursor, or an
            open-source equivalent, and you want the software you
            ship to stay readable, testable, and maintainable after
            the first commit.
          </p>
        </div>
      </div>
      {AUDIENCE.map((entry) => (
        <div
          key={entry.id}
          className="flex flex-col transition-colors hover:bg-accent/40"
        >
          <p className="text-label-13 text-muted-foreground p-6 pb-0">
            {entry.eyebrow}
          </p>
          <h3 className="text-heading-20 tracking-tight text-foreground !m-0 px-6 pt-2">
            {entry.takeaway}
          </h3>
          <p className="text-copy-14 text-muted-foreground leading-6 px-6 pt-2 flex-1 pb-6 [&:not(:first-child)]:mt-0">
            {entry.body}
          </p>
        </div>
      ))}
    </Section>
  )
}
