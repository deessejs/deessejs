/**
 * /help Community section.
 *
 * Lead paragraph + <ul> of three list-disc items linking to GitHub
 * discussions/issues, X, and LinkedIn. All external links use
 * raw <a target="_blank" rel="noopener noreferrer">.
 *
 * Rhythm:
 * - Outer `space-y-4` (16px) between heading and the lead
 *   paragraph.
 * - Inter-paragraph `space-y-2` (8px) on the lead <p> to <ul>
 *   boundary.
 * - Inter-row `space-y-2 pl-4` (8px) between list items.
 *
 * The `[&:not(:first-child)]:mt-0` override is removed
 * (redundant under `space-y-*`).
 */
export function Community() {
  return (
    <section className="space-y-4">
      <h2 className="text-heading-24 tracking-tight text-foreground">
        Community
      </h2>
      <p className="text-copy-16 text-muted-foreground">
        Discussions and announcements live on the channels below. Use the
        one that fits the topic.
      </p>
      <ul className="space-y-2 pl-4 text-copy-16 text-muted-foreground">
        <li className="list-disc">
          <a
            href="https://github.com/deessejs/deessejs/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4 hover:text-foreground"
          >
            GitHub discussions
          </a>{" "}
          for questions, ideas, and show-and-tell.
        </li>
        <li className="list-disc">
          <a
            href="https://github.com/deessejs/deessejs/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4 hover:text-foreground"
          >
            GitHub issues
          </a>{" "}
          for confirmed bugs only.
        </li>
        <li className="list-disc">
          <a
            href="https://x.com/deessejs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4 hover:text-foreground"
          >
            X
          </a>{" "}
          and{" "}
          <a
            href="https://www.linkedin.com/company/deessejs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4 hover:text-foreground"
          >
            LinkedIn
          </a>{" "}
          for announcements.
        </li>
      </ul>
    </section>
  )
}
