import { ExternalLink } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

const COMPONENTS_REPO_URL =
  "https://github.com/deessejs/deessejs/tree/main/packages/ui"

type Props = {
  title?: string
  body?: string
}

/**
 * Footer CTA reused by `/components` and every
 * `/components/[category]` dummy page. Carries over unchanged in V2.
 */
export function FooterCta({
  title = "Read the source.",
  body,
}: Props) {
  return (
    <section
      aria-labelledby="cta-heading"
      className="flex flex-col items-start gap-6 rounded-lg border border-border bg-muted/30 p-8 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex flex-col gap-2">
        <h2
          id="cta-heading"
          className="text-heading-24 tracking-tight text-foreground !m-0"
        >
          {title}
        </h2>
        <p className="text-copy-14 text-muted-foreground [&:not(:first-child)]:mt-0">
          {body ?? (
            <>
              Every primitive lives in{" "}
              <code className="font-mono text-foreground/90">
                packages/ui
              </code>
              . MIT, no paywall.
            </>
          )}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <a
            href={COMPONENTS_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </Button>
      </div>
    </section>
  )
}