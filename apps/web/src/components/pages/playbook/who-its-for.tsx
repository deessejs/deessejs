/**
 * /playbook "Who it's for" section.
 *
 * Names the audience concretely, without inventing personas or
 * reaching for marketing superlatives. The audience is dev-tool
 * native: developers who already use AI coding agents and want
 * their software to age well.
 *
 * Restrained copy: bullets, no banner icons, no badges.
 */
export function WhoItsFor() {
  return (
    <section
      aria-labelledby="playbook-who-heading"
      className="border-b border-border px-6 py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <h2
          id="playbook-who-heading"
          className="text-heading-32 tracking-tight"
        >
          Who it's for
        </h2>
        <p className="text-copy-16 leading-7 text-foreground [&:not(:first-child)]:mt-0">
          The playbook is for developers who already build with AI coding
          agents — Claude Code, Codex, Cursor, open-source equivalents —
          and want the software they ship to stay readable, testable,
          and maintainable after the first commit.
        </p>
        <ul className="flex flex-col gap-2 pl-4 text-copy-16 leading-7 text-muted-foreground">
          <li className="list-disc">
            You write code today; you expect to keep doing so.
          </li>
          <li className="list-disc">
            You treat agents as a fast junior who needs clear briefs, not
            as a replacement for engineering judgement.
          </li>
          <li className="list-disc">
            You care about what the codebase looks like next month, not
            just what runs today.
          </li>
        </ul>
        <p className="text-copy-16 leading-7 text-foreground [&:not(:first-child)]:mt-0">
          The guide does not cover prompting theory, model comparison, or
          how to swap providers. The premise is that you already use an
          agent, and the friction is in the project shape it leaves
          behind.
        </p>
      </div>
    </section>
  )
}
