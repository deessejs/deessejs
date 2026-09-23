import { FinalCta as FinalCtaShell } from "../_shared/final-cta"

/**
 * /delivery Final CTA.
 *
 * Single mailto to the engineering team. No Install CLI / Browse
 * registry (those links would undermine the engineering
 * positioning).
 */
export function FinalCta() {
  return (
    <FinalCtaShell
      noBorderB
      eyebrow="Ready to ship?"
      title="Skip 3 months of senior engineer salary."
      body="Book a 20-minute scoping call. We scope the engagement in plain English, you decide. No proposal deck, no obligation."
      actions={[
        {
          label: "Book an Engineering Scoping Call",
          href: "mailto:support@deessejs.com?subject=Delivery%20scoping%20call",
          withArrow: true,
        },
      ]}
    />
  )
}
