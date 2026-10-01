import { Card } from "@workspace/ui/components/card"

/**
 * /help Community section.
 *
 * Lead paragraph + a 1×3 grid of Cards (one per channel). The
 * Cards give the list a surface treatment consistent with the
 * trust-and-compliance pattern on /enterprise
 * (`enterprise/trust-and-compliance.tsx:28-49`).
 */
export function Community() {
  return (
    <section className="space-y-4">
      <h2 className="text-heading-24 tracking-tight text-foreground">
        Community
      </h2>
      <p className="text-copy-16 text-muted-foreground [&:not(:first-child)]:mt-0 max-w-2xl">
        Discussions and announcements live on the channels below. Use the
        one that fits the topic.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-copy-16 text-foreground">
            <a
              href="https://github.com/deessejs/deessejs/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-label-14 font-semibold tracking-tight text-foreground underline-offset-4 hover:underline"
            >
              GitHub discussions
            </a>
            <span className="text-muted-foreground">
              <br />
              for questions, ideas, and show-and-tell.
            </span>
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-copy-16 text-foreground">
            <a
              href="https://github.com/deessejs/deessejs/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-label-14 font-semibold tracking-tight text-foreground underline-offset-4 hover:underline"
            >
              GitHub issues
            </a>
            <span className="text-muted-foreground">
              <br />
              for confirmed bugs only.
            </span>
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-copy-16 text-foreground">
            <a
              href="https://x.com/deessejs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-label-14 font-semibold tracking-tight text-foreground underline-offset-4 hover:underline"
            >
              X
            </a>{" "}
            <span className="text-muted-foreground">and </span>
            <a
              href="https://www.linkedin.com/company/deessejs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-label-14 font-semibold tracking-tight text-foreground underline-offset-4 hover:underline"
            >
              LinkedIn
            </a>
            <span className="text-muted-foreground">
              <br />
              for announcements.
            </span>
          </p>
        </Card>
      </div>
    </section>
  )
}
