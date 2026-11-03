import { FinalCta } from "@/components/pages/_shared/final-cta"

export function ContentFinalCta() {
  return (
    <FinalCta
      eyebrow="Ready to ship?"
      title="Read more, or ship with us."
      body="Subscribe to the blog and changelog feeds, install the CLI to scaffold a project in under five minutes, or talk to our delivery team if you need a hand. Same templates, same contracts, same guarantees."
      actions={[
        {
          label: "Install the CLI",
          href: "/knowledge-base/guides/install-deessejs-cli",
          withArrow: true,
        },
        {
          label: "Browse the registry",
          href: "/templates",
          variant: "outline",
        },
      ]}
    />
  )
}
