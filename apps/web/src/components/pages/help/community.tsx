/**
 * /help Community section.
 *
 * Lead paragraph + <ul> of three list-disc items linking to GitHub
 * discussions/issues, X, and LinkedIn. All external links use
 * raw <a target="_blank" rel="noopener noreferrer">.
 */
export function Community() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-heading-24 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
        Community
      </h2>
      <p className="text-copy-16 text-muted-foreground [&:not(:first-child)]:mt-0">
        Discussions and announcements live on the channels below. Use the
        one that fits the topic.
      </p>
      <ul className="flex flex-col gap-2 pl-4 text-copy-16 text-muted-foreground">
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
