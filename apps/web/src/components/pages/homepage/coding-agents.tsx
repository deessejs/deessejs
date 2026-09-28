import { Section } from "@/app/(marketing)/_components/section"
import { CODING_AGENTS } from "@/lib/marketing/home-data"

/**
 * Coding-agents compatibility wall.
 *
 * Sits next to the 'Bring your own providers' section on the
 * homepage, but covers a distinct promise: every template ships with
 * contracts a coding agent can read, regardless of which CLI the
 * developer runs. Showing the 6 supported harnesses here closes
 * the loop on the 'AGENTS.md + MCP + typed contracts' promise
 * the FAQ item 4 and the AI use-case page already make.
 *
 * Distinct from INTEGRATIONS on purpose: INTEGRATIONS lists
 * interchangeable providers behind a contract (Frameworks, Hosting,
 * Data, Billing). Coding agents are *consumers* of the system,
 * not providers, so they get their own visual treatment — a single
 * 6-cell row rather than the categorized 2-col grid.
 *
 * Logo slugs match the simple-icons / t3.codes convention and
 * resolve to `/public/logos/<slug>.svg`. SVGs use fill="currentColor"
 * so they render in monochrome against the text-foreground ink and
 * the dark:invert class flips them in dark mode.
 */
export function CodingAgents() {
  return (
    <Section>
      <div className="flex flex-col gap-2 p-6 lg:p-10">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Coding agents
        </p>
        <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
          Works with any coding agent.
        </h2>
        <p className="max-w-3xl text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
          Every template ships with the contracts your coding agent reads —
          typed at every boundary, AGENTS.md at the monorepo root, an MCP
          manifest for the tools. Pick the CLI, the contracts stay the
          same.
        </p>
      </div>
      <div className="border-t border-border">
        <ul className="grid grid-cols-2 divide-y divide-border border-0 sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0 lg:divide-x">
          {CODING_AGENTS.map((agent) => (
            <li
              key={agent.name}
              className="flex items-center justify-center gap-3 p-6 text-copy-14 font-medium text-foreground lg:p-8"
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
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
