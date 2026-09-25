import Link from "next/link"

import { Card } from "@workspace/ui/components/card"

/**
 * /help Self-serve section.
 *
 * Three link rows (Knowledge Base, Docs, Changelog), each
 * rendered as a small `<Card>` with the link label and a
 * one-line caption. The Card surface gives the row a visible
 * edge in line with the rest of the marketing app
 * (`enterprise/trust-and-compliance.tsx:28-49`,
 * `homepage/contracts.tsx:11-19`); previously this was a
 * plain flat list which read as monotonous inside the rest of
 * the page.
 *
 * External link uses raw <a target="_blank" rel="noopener
 * noreferrer">.
 */
export function SelfServe() {
  return (
    <section className="space-y-4">
      <h2 className="text-heading-24 tracking-tight text-foreground">
        Self-serve
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex flex-col gap-1">
            <Link
              href="/knowledge-base"
              className="text-label-14 font-semibold tracking-tight text-foreground underline-offset-4 hover:underline"
            >
              Knowledge Base
            </Link>
            <p className="text-copy-14 text-muted-foreground">
              How-tos and reference material for common tasks.
            </p>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex flex-col gap-1">
            <a
              href="https://docs.deessejs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-label-14 font-semibold tracking-tight text-foreground underline-offset-4 hover:underline"
            >
              Docs
            </a>
            <p className="text-copy-14 text-muted-foreground">
              The full DeesseJS reference. API, configuration, deployment.
            </p>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex flex-col gap-1">
            <Link
              href="/changelog"
              className="text-label-14 font-semibold tracking-tight text-foreground underline-offset-4 hover:underline"
            >
              Changelog
            </Link>
            <p className="text-copy-14 text-muted-foreground">
              Release notes and version history. Useful to confirm whether a bug
              you found is known and fixed.
            </p>
          </div>
        </Card>
      </div>
    </section>
  )
}
