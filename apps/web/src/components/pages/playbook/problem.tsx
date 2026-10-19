/**
 * /playbook "The problem" section.
 *
 * Names the central pain without making it universal: agent-generated
 * code that works at the moment of write, but harder to understand,
 * verify, or evolve a few days later. The copy is restrained on
 * purpose: no villain framing, no doom language. The page is a
 * working guide, not a sales pitch.
 *
 * Standardized wrapper: `border-b border-border px-6 py-16 md:py-20
 * lg:py-24`, max-w-5xl column. Header follows the H2 recipe
 * (`text-heading-32 tracking-tight`), body follows `text-copy-16
 * leading-7 text-foreground`.
 */
export function Problem() {
  return (
    <section
      aria-labelledby="playbook-problem-heading"
      className="border-b border-border px-6 py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <h2
          id="playbook-problem-heading"
          className="text-heading-32 tracking-tight"
        >
          Code that works, code that holds up
        </h2>
        <p className="text-copy-16 leading-7 text-foreground [&:not(:first-child)]:mt-0">
          A coding agent can produce code that runs the first time. A few
          days later, the same project is harder to read, harder to test,
          and harder to change without breaking something adjacent. Most
          of that friction does not come from the agent. It comes from
          decisions the task description did not spell out and the agent
          could not guess.
        </p>
        <p className="text-copy-16 leading-7 text-foreground [&:not(:first-child)]:mt-0">
          The playbook collects the questions worth answering before you
          hand work to an agent, the foundations worth laying once, and
          the boundaries worth drawing so the code stays your software.
        </p>
      </div>
    </section>
  )
}
