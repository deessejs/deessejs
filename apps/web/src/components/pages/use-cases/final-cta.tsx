import { FinalCta as FinalCtaShell } from "../_shared/final-cta"

/**
 * Use cases Final CTA — shared by all 7 static routes under
 * /use-cases/{saas-apps,ai-products,api-backends,internal-tools,
 * mobile-backend,open-source,landing-pages}/page.tsx.
 *
 * Two-door entry. The use-case pages serve two buyers who arrive
 * with different intents:
 *   - DIY: "give me the code, I'll ship it." → /templates
 *   - Service: "build it with us." → /delivery
 *
 * The shell renders both as equally-typed actions, no preference
 * signalled. The eyebrow "Two doors" makes the framing explicit
 * so the visitor reads the section as a choice, not as a hard
 * sell toward one funnel.
 *
 * `signupHref` is no longer used here (kept only in the prop
 * signature for the call sites that still pass it, so the page
 * signature stays identical across the 7 routes).
 */
export function FinalCta() {
  return (
    <FinalCtaShell
      noBorderB
      eyebrow="Two doors"
      title="Use it yourself, or have us ship it for you."
      body="Self-serve gives you the registry and the templates. Engagement gives you the team that built it. Pick the door that fits the timeline."
      actions={[
        {
          label: "Browse templates",
          href: "/templates",
          variant: "default",
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
