import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { CodingAgentsChat } from "@/app/(marketing)/_components/coding-agents-chat"
import { Section } from "@/app/(marketing)/_components/section"
import { cn } from "@workspace/ui/lib/utils"
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
 *
 * The CTA below the heading sits next to the lead paragraph — it
 * routes visitors to the install guide instead of asking them to
 * copy paragraphs of body copy. The 3-icon stack shows a
 * representative slice (Claude Code, Codex, OpenCode); the full 6
 * sit in the grid beneath.
 */
const CTA_ICONS = [
  { src: "/logos/claudecode.svg", alt: "Claude Code" },
  { src: "/logos/codex.svg", alt: "Codex" },
  { src: "/logos/opencode.svg", alt: "OpenCode" },
] as const

export function CodingAgents() {
  return (
    <Section>
      <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        {/* Chat — left column (4fr / 33%) */}
        <div className="p-4 lg:p-6">
          <CodingAgentsChat />
        </div>
        {/* Editorial — right column (8fr / 66%) */}
        <div className="flex flex-col gap-4 p-6 lg:p-10">
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
          <Link
            href="/knowledge-base/guides/install-deessejs-cli"
            aria-label="Onboard your agent — open the install guide"
            className="group/cta inline-flex w-fit items-center gap-3 self-start rounded-full border border-border bg-background py-1.5 pl-1.5 pr-3.5 text-copy-14 font-medium text-foreground transition-colors hover:bg-accent/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span aria-hidden className="flex -space-x-3">
              {CTA_ICONS.map((icon, idx) => (
                <span
                  key={icon.src}
                  className="relative inline-flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-[0_0_0_1px_var(--background)]"
                  style={{ zIndex: CTA_ICONS.length - idx }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={icon.src}
                    alt=""
                    width={14}
                    height={14}
                    className="size-3.5 dark:invert"
                    aria-hidden
                  />
                </span>
              ))}
            </span>
            <span className="font-medium">Onboard your agent</span>
            <ArrowUpRight
              aria-hidden
              className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover/cta:text-foreground"
            />
          </Link>
        </div>
        {/* Chat — right column (4fr / 33%) */}
        <div className="p-4 lg:p-6">
          <CodingAgentsChat />
        </div>
      </div>
      <div className="border-t border-border">
        <ul className="grid grid-cols-2 divide-y divide-border border-0 sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
          {CODING_AGENTS.map((agent, idx) => (
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
                aria-label={`${agent.name} — open the docs.deessejs.com onboarding guide in a new tab`}
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
