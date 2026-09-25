import { FinalCta as FinalCtaShell } from "../_shared/final-cta"

/**
 * /about Final CTA.
 *
 * Two actions so visitors who arrive from the narrative either
 * move into the self-serve registry or escalate to a senior
 * engagement:
 * - Primary "Browse templates" → `/templates` (self-serve).
 * - Outline "Talk to delivery" → `/delivery` (the engagement
 *   funnel — only offered as a secondary, not pushed).
 *
 * noBorderB so the GlobalLayout wraps the page cleanly.
 */
export function FinalCta() {
  return (
    <FinalCtaShell
      noBorderB
      eyebrow="About"
      title="Want to see the templates?"
      body="All the moving pieces — registry, contracts, CLI, docs — anchor on one surface. Browse the catalog, or talk to a senior engineer about your specific stack."
      actions={[
        {
          label: "Browse templates",
          href: "/templates",
          withArrow: true,
        },
        {
          label: "Talk to delivery",
          href: "/delivery",
          variant: "outline",
        },
      ]}
    />
  )
}
