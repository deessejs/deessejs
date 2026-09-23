import { FinalCta as FinalCtaShell } from "../_shared/final-cta"

/**
 * Homepage Final CTA. "Use the templates. Or ship with us."
 * Three actions: install the CLI (primary), talk to delivery,
 * browse the registry.
 */
export function FinalCta() {
  return (
    <FinalCtaShell
      eyebrow="Ready to ship?"
      title="Use the templates. Or ship with us."
      body="Install the CLI to scaffold a project in under five minutes. Or talk to our delivery team. Same templates, same contracts, same guarantees."
      actions={[
        {
          label: "Install the CLI",
          href: "/knowledge-base/guides/install-deessejs-cli",
          withArrow: true,
        },
        {
          label: "Talk to delivery",
          href: "/delivery",
          variant: "outline",
        },
        {
          label: "Browse the registry",
          href: "/templates",
          variant: "ghost",
        },
      ]}
    />
  )
}
