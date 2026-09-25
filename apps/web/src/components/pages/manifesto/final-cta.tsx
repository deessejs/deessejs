import { FinalCta as FinalCtaShell } from "../_shared/final-cta"

/**
 * /manifesto Final CTA.
 *
 * Two actions that pair with the page's narrative arc:
 * - Primary "Read the principles" → /principles. The manifesto
 *   is the *why*; the principles page is the *how*. Sequential
 *   reading is the obvious next step.
 * - Outline "Browse templates" → /templates. The pages visitors
 *   came here to find.
 *
 * Rendered as a sibling of the <div className="max-w-5xl">
 * wrapper so the shell's border-t/border-b trace the full
 * page-edge (same pattern as /about and /help).
 *
 * noBorderB so the GlobalLayout wraps the page cleanly.
 */
export function FinalCta() {
  return (
    <FinalCtaShell
      noBorderB
      eyebrow="Manifesto"
      title="Read the operating rules."
      body="Manifesto is the why. Principles is the how. Both are short; both are public."
      actions={[
        {
          label: "Read the principles",
          href: "/principles",
          withArrow: true,
        },
        {
          label: "Browse templates",
          href: "/templates",
          variant: "outline",
        },
      ]}
    />
  )
}
