import { FinalCta as FinalCtaShell } from "../_shared/final-cta"

/**
 * Playbook Final CTA. Closes the page with the same block the
 * homepage uses.
 *
 * Copy and actions are identical to `Home.FinalCta`: "Ready to
 * ship?", the templates-or-delivery pitch, and the two buttons.
 * The playbook is a lead magnet on the same site, so the closing
 * ask should not fork into a different one.
 *
 * Delegates to the shared `FinalCtaShell` rather than hand-rolling
 * the 2-col block, exactly as the homepage, /pricing, /about, and
 * /enterprise do. The shell owns the border, padding, grid, and
 * button styles so the closing block stays visually identical
 * across every public page.
 */
export function FinalCta() {
  return (
    <FinalCtaShell
      eyebrow="Ready to ship?"
      title="Use the templates. Or ship with us."
      body="Browse the registry to pick a template. Or talk to our delivery team. Same templates, same contracts, same guarantees."
      actions={[
        {
          label: "Browse the registry",
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
