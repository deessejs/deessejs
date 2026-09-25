import Link from "next/link"

/**
 * /help Self-serve section.
 *
 * Three link rows pointing at the canonical self-serve surfaces:
 * Knowledge Base (internal), Docs (external), Changelog (internal).
 * External link uses raw <a target="_blank" rel="noopener noreferrer">.
 */
export function SelfServe() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-heading-24 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
        Self-serve
      </h2>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Link
            href="/knowledge-base"
            className="text-copy-16 font-medium text-foreground underline-offset-4 hover:underline"
          >
            Knowledge Base
          </Link>
          <p className="text-copy-14 text-muted-foreground [&:not(:first-child)]:mt-0">
            How-tos and reference material for common tasks.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <a
            href="https://docs.deessejs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-copy-16 font-medium text-foreground underline-offset-4 hover:underline"
          >
            Docs
          </a>
          <p className="text-copy-14 text-muted-foreground [&:not(:first-child)]:mt-0">
            The full DeesseJS reference. API, configuration, deployment.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <Link
            href="/changelog"
            className="text-copy-16 font-medium text-foreground underline-offset-4 hover:underline"
          >
            Changelog
          </Link>
          <p className="text-copy-14 text-muted-foreground [&:not(:first-child)]:mt-0">
            Release notes and version history. Useful to confirm whether a bug
            you found is known and fixed.
          </p>
        </div>
      </div>
    </section>
  )
}
