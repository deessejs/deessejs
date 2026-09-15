import Link from "next/link"
import type { ReactNode } from "react"
import { ExternalLink } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

export type FooterCtaProps = {
  title: string
  body: ReactNode
  /** Primary action (solid button). */
  primaryLabel: string
  primaryHref: string
  primaryExternal?: boolean
  /** Secondary action (outline button). Optional — omit for a single-CTA card. */
  secondaryLabel?: string
  secondaryHref?: string
  secondaryExternal?: boolean
}

/**
 * Reusable footer CTA card. Calque of `pricing/page.tsx:427-451` —
 * rounded card with muted background, primary + optional secondary
 * action buttons, side-by-side on desktop, stacked on mobile.
 *
 * Lives inside `<article>` directly (no extra wrapper needed) — the
 * `border border-border bg-muted/30 rounded-lg` classes make the
 * `<section>` itself the card. Both internal links (`<Link>`) and
 * external links (`<a target="_blank">) are supported via the `*
 * External` flags.
 *
 * V1 dummy for `/components` and `/blocks` registries. V2 keeps the
 * shape; only `body` and `primaryLabel`/hrefs swap per route.
 */
export function FooterCta({
  title,
  body,
  primaryLabel,
  primaryHref,
  primaryExternal = false,
  secondaryLabel,
  secondaryHref,
  secondaryExternal = false,
}: FooterCtaProps) {
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
          {body}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          {primaryExternal ? (
            <a
              href={primaryHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              {primaryLabel}
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : (
            <Link href={primaryHref}>{primaryLabel}</Link>
          )}
        </Button>
        {secondaryLabel && secondaryHref ? (
          <Button asChild variant="outline">
            {secondaryExternal ? (
              <a
                href={secondaryHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                {secondaryLabel}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            ) : (
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            )}
          </Button>
        ) : null}
      </div>
    </section>
  )
}