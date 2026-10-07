import { CodingAgentsDemo } from "@/components/marketing/coding-agents-demo"
import { Section } from "@/components/marketing/section"
import { cn } from "@workspace/ui/lib/utils"
import { CODING_AGENTS } from "@/lib/marketing/home-data"

/**
 * Coding-agents compatibility wall.
 *
 * Sits next to the 'Bring your own providers' section on the
 * homepage, but covers a distinct promise: every template ships
 * with contracts a coding agent can read, regardless of which
 * CLI the developer runs. Showing the 6 supported harnesses in
 * the grid below closes the loop on the 'AGENTS.md + MCP + typed
 * contracts' promise the FAQ item 4 and the AI use-case page
 * already make.
 *
 * Distinct from INTEGRATIONS on purpose: INTEGRATIONS lists
 * interchangeable providers behind a contract (Frameworks,
 * Hosting, Data, Billing). Coding agents are *consumers* of the
 * system, not providers, so they get their own visual treatment
 * — a single 6-cell row rather than the categorized 2-col grid.
 *
 * Logo slugs match the simple-icons / t3.codes convention and
 * resolve to `/public/logos/<slug>.svg`. SVGs use
 * fill="currentColor" so they render in monochrome against the
 * text-foreground ink and the dark:invert class flips them in
 * dark mode.
 *
 * The 2-col demo (chat + accordion stack) lives in its own
 * client component so the parent stays Server- and only the
 * demo pays the hydration cost. The full conversation content
 * (per-scenario turns, CLI blocks, accordion fill animation)
 * lives in `apps/web/src/app/(marketing)/_components/
 * coding-agents-demo.tsx`.
 */
export function CodingAgents() {
  return (
    <Section>
      <CodingAgentsDemo />
      <div className="border-t border-border">
        <ul className="grid grid-cols-2 divide-y divide-border border-0 sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
          {CODING_AGENTS.map((agent) => (
            <li
              key={agent.name}
              className={cn(
                "border-0 p-0",
                "border-l border-border first:border-l-0",
              )}
            >
              <a
                href={`https://docs.deessejs.com/agents/${agent.docsSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${agent.name}, open the docs.deessejs.com onboarding guide in a new tab`}
                className="group/card flex h-full items-center justify-center gap-3 p-6 text-copy-14 font-medium text-foreground transition-colors hover:bg-accent/40 lg:p-8"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/logos/${agent.logo}.svg`}
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 shrink-0 dark:invert"
                  aria-hidden
                />
                {agent.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
