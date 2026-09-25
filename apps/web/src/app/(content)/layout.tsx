import * as React from "react"

import { FinalCta } from "@/components/pages/_shared/final-cta"

/**
 * Layout for the entire `(content)` route group.
 *
 * The shared-border card, container padding, and diagonal-stripe
 * framing are supplied by `<GlobalLayout>` in `apps/web/src/app/layout.tsx`,
 * so this layout only adds the surface-specific extras.
 *
 * Closes every content page with the shared FinalCta shell, with
 * the copy tuned for content surfaces (blog / changelog / KB).
 */
export default function ContentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
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
    </>
  )
}
