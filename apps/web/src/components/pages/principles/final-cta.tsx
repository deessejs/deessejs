import { FinalCta as FinalCtaShell } from "../_shared/final-cta"

/**
 * /principles Final CTA.
 *
 * Two actions that pair with the page's operational rules:
 * - Primary "Talk to delivery" → /delivery. If the principles
 *   resonated, the next step for a team is an engagement.
 * - Outline "Read the manifesto" → /manifesto. Closes the loop
 *   with the philosophical counterpart (manifesto = why,
 *   principles = how).
 *
 * Rendered as a sibling of the max-w-5xl wrapper (same pattern
 * as /about, /help, /manifesto). noBorderB so the GlobalLayout
 * wraps the page cleanly.
 */
export function FinalCta() {
  return (
    <FinalCtaShell
      noBorderB
      eyebrow="Principles"
      title="Put it on your team."
      body="A senior engineer can scaffold your first template, wire your auth and DB, and ship a production-ready codebase on your own infrastructure."
      actions={[
        {
          label: "Talk to delivery",
          href: "/delivery",
          withArrow: true,
        },
        {
          label: "Read the manifesto",
          href: "/manifesto",
          variant: "outline",
        },
      ]}
    />
  )
}
