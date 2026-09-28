import Link from "next/link"
import { Copy } from "lucide-react"

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
 *
 * The CTA below the heading replaces a lead paragraph — it routes
 * visitors to the install guide instead of asking them to copy
 * paragraphs of body copy. The 3-icon stack shows a representative
 * slice (Claude Code, Codex, OpenCode); the full 6 sit in the grid
 * beneath.
 */
const CTA_ICONS = [
  { src: "/logos/claudecode.svg", alt: "Claude Code" },
  { src: "/logos/codex.svg", alt: "Codex" },
  { src: "/logos/opencode.svg", alt: "OpenCode" },
] as const

export function CodingAgents() {
  return (
    <Section>
      <div className="flex flex-col gap-4 p-6 lg:p-10">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Coding agents
        </p>
        <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
          Works with any coding agent.
        </h2>
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
          <Copy
            aria-hidden
            className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover/cta:text-foreground"
          />
        </Link>
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
