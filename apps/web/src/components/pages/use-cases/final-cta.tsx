import { FinalCta as FinalCtaShell } from "../_shared/final-cta"

/**
 * Use cases Final CTA — shared by all 7 static routes under
 * /use-cases/{saas-apps,ai-products,api-backends,internal-tools,
 * mobile-backend,open-source,landing-pages}/page.tsx.
 *
 * Same copy as /pricing ("Ready to ship?" + "Start with a template.
 * Keep the contracts.") because both pages target the same next-step
 * decision: install the CLI, pick a starter, ship. The two CTAs
 * (Start now → apps/app signup, Browse the registry → /templates)
 * are also identical.
 *
 * `signupHref` is resolved server-side by each page route and passed
 * in pre-formatted. Same convention as the site header: the
 * apps/app origin is a server-resolved absolute URL so the link
 * never needs client-side URL composition.
 */
export function FinalCta({ signupHref }: { signupHref: string }) {
  return (
    <FinalCtaShell
      noBorderB
      eyebrow="Ready to ship?"
      title="Start with a template. Keep the contracts."
      body="Install the CLI, pick a starter, and your agent gets every contract it needs to navigate the rest of the project."
      actions={[
        {
          label: "Start now",
          href: signupHref,
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
