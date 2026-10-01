import { FinalCta as FinalCtaShell } from "../_shared/final-cta"

/**
 * Homepage Final CTA. "Use the templates. Or ship with us."
 *
 * Two actions: browse the registry (primary) or talk to delivery.
 * The previous "Install the CLI" path was dropped — the registry
 * page is the better entry point for the templates / scaffolding
 * journey and the install guide is one click away from there.
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
