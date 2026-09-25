import { FinalCta as FinalCtaShell } from "../_shared/final-cta"

/**
 * /help Final CTA.
 *
 * Two actions for visitors who finished the page without
 * resolving their question:
 * - Primary "Email the team" → mailto:support@deessejs.com. The
 *   page lists the same address inline above; the shell button
 *   is the explicit conversion pull.
 * - Outline "Browse the docs" → external docs.deessejs.com.
 *
 * noBorderB so the GlobalLayout wraps the page cleanly.
 */
export function FinalCta() {
  return (
    <FinalCtaShell
      noBorderB
      eyebrow="Help"
      title="Still stuck?"
      body="The team replies to inbound in under two business days. Open a thread or send a note, whichever feels lighter."
      actions={[
        {
          label: "Email the team",
          href: "mailto:support@deessejs.com?subject=Help%20request",
          withArrow: true,
        },
        {
          label: "Browse the docs",
          href: "https://docs.deessejs.com",
          variant: "outline",
        },
      ]}
    />
  )
}
