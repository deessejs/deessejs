import { FinalCta as FinalCtaShell } from "../_shared/final-cta"

/**
 * /vision Final CTA.
 *
 * Two actions that close the page's temporal progression:
 * - Primary "Browse templates" → /templates. The Now bucket
 *   is the catalog visitors can already pull from — that's
 *   the strongest pull from a vision page.
 * - Outline "Read the changelog" → /changelog. The Next bucket
 *   lives in the changelog; reading it is the second-most
 *   obvious next step.
 *
 * Rendered as a sibling of the max-w-5xl wrapper (same pattern
 * as /about, /help, /manifesto, /principles). noBorderB so the
 * GlobalLayout wraps the page cleanly.
 */
export function FinalCta() {
  return (
    <FinalCtaShell
      noBorderB
      eyebrow="Vision"
      title="See what's shipping."
      body="The Now bucket is the registry you can already pull from. The CLI is the surface engineers use to scaffold."
      actions={[
        {
          label: "Browse templates",
          href: "/templates",
          withArrow: true,
        },
        {
          label: "Read the changelog",
          href: "/changelog",
          variant: "outline",
        },
      ]}
    />
  )
}
