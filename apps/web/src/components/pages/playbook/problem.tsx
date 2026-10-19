import { Section } from "@/components/marketing/section"

interface FrictionEntry {
  /** Stable key for React; matches the order in the source list. */
  id: string
  /** Short verb above the takeaway. */
  eyebrow: string
  /** Verb-first takeaway (mirrors the H2's "harder to X" phrasing). */
  takeaway: string
  /** One-paragraph description of what the friction looks like. */
  body: string
}

/**
 * Three friction points, in the same data shape as
 * `content/toc.ts` and the WhoItsFor audience list. Placeholder
 * copy pending real reader research.
 */
const FRICTIONS: ReadonlyArray<FrictionEntry> = [
  {
    id: "read",
    eyebrow: "Read",
    takeaway: "Harder to read a few days later",
    body: "The project resists the kind of skim you'd do on your own code. Variables get named twice. Patterns repeat because the agent didn't see the third place to factor them out.",
  },
  {
    id: "test",
    eyebrow: "Test",
    takeaway: "Harder to test without breaking something",
    body: "Coupling that the agent didn't see forces you to mock half the system to cover one path. The unit tests pass, the integration test does not, and the failure is three layers away from the change.",
  },
  {
    id: "change",
    eyebrow: "Change",
    takeaway: "Harder to change without breaking something adjacent",
    body: "Edits land in adjacent files for reasons no one can trace. A line that should have been local becomes a small refactor. The diff keeps growing, and the next change starts from an even wider blast radius.",
  },
] as const

/**
 * /playbook "The problem" section.
 *
 * Same recipe as the homepage's ForWho and the playbook's own
 * "What you'll find" and "Who it's for" sections: `<Section>`
 * is the grid container, the header spans all three columns
 * with eyebrow + h2 + description, the three cells are plain
 * divs with ForWho's label + h3 + body typography. No Card
 * primitive, no rounded corners, transparent background.
 *
 * The friction points are pulled out of the original P1 (which
 * said "harder to read, harder to test, harder to change" in a
 * single sentence) and made explicit as three cells.
 */
export function Problem() {
  return (
    <Section className="grid grid-cols-1 md:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x divide-border">
      <div className="flex flex-col col-span-1 md:col-span-3 border-0">
        <div className="flex flex-col gap-2 p-6 border-b border-border">
          <p className="text-label-13 text-muted-foreground">
            The problem
          </p>
          <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
            Code that works, code that holds up
          </h2>
          <p className="text-copy-16 text-muted-foreground leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
            A coding agent can produce code that runs the first
            time. A few days later, the same project is harder to
            read, harder to test, and harder to change.
          </p>
        </div>
      </div>
      {FRICTIONS.map((entry) => (
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
