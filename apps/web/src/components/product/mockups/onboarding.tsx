/**
 * Onboarding flow — first version.
 *
 * Shows the canonical 3-step onboarding surface for a B2B SaaS:
 *   1. Workspace signup (email + workspace name)
 *   2. Email verification (token sent)
 *   3. Invite teammates (email chips)
 *
 * Static — no motion. Pairs with the "Onboarding" capability card
 * in /use-cases/saas-apps. Designed to be readable inside the
 * peek pattern of <CapabilitiesTabs>: visible portion sits in
 * the bottom-right corner of the column, ~25% past the corner.
 *
 * Future edits: tune copy, add a "billing plan" step, swap
 * placeholder names.
 */
export function OnboardingMockup() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <ol className="flex flex-col gap-3">
        <li className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 font-mono text-label-12 text-emerald-700 dark:text-emerald-400"
          >
            ✓
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-copy-13 text-foreground">
              Workspace created
            </span>
            <span className="font-mono text-label-12 text-muted-foreground">
              acme.deessejs.app
            </span>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 font-mono text-label-12 text-muted-foreground"
          >
            2
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-copy-13 text-foreground">
              Verify your email
            </span>
            <span className="font-mono text-label-12 text-muted-foreground">
              Token sent to ops@acme.com
            </span>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 font-mono text-label-12 text-muted-foreground"
          >
            3
          </span>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-copy-13 text-foreground">
              Invite your team
            </span>
            <div className="flex flex-wrap gap-1">
              {["alice@", "bob@", "carol@"].map((prefix) => (
                <span
                  key={prefix}
                  className="rounded-sm border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-label-12 text-muted-foreground"
                >
                  {prefix}…
                </span>
              ))}
            </div>
          </div>
        </li>
      </ol>
    </div>
  )
}
