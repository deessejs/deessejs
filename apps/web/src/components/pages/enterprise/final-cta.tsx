import { FinalCta as FinalCtaShell } from "../_shared/final-cta"

/**
 * /enterprise Final CTA.
 *
 * Two actions so visitors who don't need a custom engagement can
 * still move forward:
 * - Primary "Talk to delivery" routes to /delivery (the engagement
 *   funnel — matches the page's promise).
 * - Outline "See templates" routes to /templates (the self-serve
 *   fallback — the visitor may not need a senior engineer at all,
 *   and we'd rather they browse the registry than bounce).
 *
 * `/delivery` and `/templates` both live in the same Next.js app
 * (apps/web), so no cross-app URL composition is needed.
 */
export function FinalCta() {
  return (
    <FinalCtaShell
      noBorderB
      eyebrow="Ready to ship?"
      title="Have specific architecture requirements?"
      body="A senior engineer joins your channel, we agree on a scope within three business days, and the codebase lands in your repository on a fixed cadence."
      actions={[
        {
          label: "Talk to delivery",
          href: "/delivery",
          withArrow: true,
        },
        {
          label: "See templates",
          href: "/templates",
          variant: "outline",
        },
      ]}
    />
  )
}
