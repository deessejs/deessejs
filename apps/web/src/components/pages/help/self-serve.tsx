import Link from "next/link"

/**
 * /help Self-serve section.
 *
 * Three link rows pointing at the canonical self-serve surfaces:
 * Knowledge Base (internal), Docs (external), Changelog (internal).
 * External link uses raw <a target="_blank" rel="noopener noreferrer">.
 *
 * Rhythm:
 * - Outer `space-y-4` (16px) between heading and the rows group
 *   (matches the other /help sections).
 * - Inter-row `space-y-4` (16px), up from `gap-3` (12px). The
 *   prior gap made the rows visually merge into a single block.
 * - Intra-row `space-y-1` (4px), kept tight on purpose: link
 *   and its caption should read as a single unit.
 *
 * The `[&:not(:first-child)]:mt-0` override on the row-caption
 * paragraph has been removed (redundant under `space-y-*`).
 */
export function SelfServe() {
  return (
    <section className="space-y-4">
      <h2 className="text-heading-24 tracking-tight text-foreground">
        Self-serve
      </h2>
      <div className="space-y-4">
        <div className="space-y-1">
          <Link
            href="/knowledge-base"
            className="text-copy-16 font-medium text-foreground underline-offset-4 hover:underline"
          >
            Knowledge Base
          </Link>
          <p className="text-copy-14 text-muted-foreground">
            How-tos and reference material for common tasks.
          </p>
        </div>
        <div className="space-y-1">
          <a
            href="https://docs.deessejs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-copy-16 font-medium text-foreground underline-offset-4 hover:underline"
          >
            Docs
          </a>
          <p className="text-copy-14 text-muted-foreground">
            The full DeesseJS reference. API, configuration, deployment.
          </p>
        </div>
        <div className="space-y-1">
          <Link
            href="/changelog"
            className="text-copy-16 font-medium text-foreground underline-offset-4 hover:underline"
          >
            Changelog
          </Link>
          <p className="text-copy-14 text-muted-foreground">
            Release notes and version history. Useful to confirm whether a bug
            you found is known and fixed.
          </p>
        </div>
      </div>
    </section>
  )
}
