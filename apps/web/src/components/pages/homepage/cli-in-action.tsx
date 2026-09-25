import Link from "next/link"
import { ArrowRight, Cloud, Radio, TerminalSquare } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import { Section } from "@/app/(marketing)/_components/section"
import { TerminalMockup } from "@/app/(marketing)/_components/terminal-mockup"
import { CLI_LINES } from "@/lib/marketing/home-data"

const COMMANDS = [
  {
    icon: TerminalSquare,
    name: "init",
    description:
      "scaffolds a project from a template, with every contract wired.",
  },
  {
    icon: Radio,
    name: "list",
    description:
      "browses the registry and check what is shipped vs coming.",
  },
  {
    icon: Cloud,
    name: "info",
    description:
      "verifies the contracts in your project are present and in sync.",
  },
] as const

/** CLI in action — 2-col: copy + commands list left, terminal mockup right. */
export function CliInAction() {
  return (
    <Section className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
      <div className="flex flex-col gap-6 p-6 lg:p-8">
        <p className="text-label-13 text-muted-foreground">The entry point</p>
        <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
          Three commands. Production-ready in one.
        </h2>
        <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
          The CLI is the single entry point to the registry. It scaffolds a
          template, lists what is available, and tells you which contracts
          are wired against your project.
        </p>
        <ul className="flex flex-col gap-3">
          {COMMANDS.map((command) => (
            <li
              key={command.name}
              className="flex items-start gap-2 text-copy-14 text-muted-foreground leading-6"
            >
              <command.icon
                className="text-foreground mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              <span>
                <span className="text-foreground">{command.name}</span>{" "}
                {command.description}
              </span>
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <Button asChild variant="outline">
            <Link href="/knowledge-base/guides/install-deessejs-cli">
              Read the install guide
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>

      <div className="p-6 lg:p-8">
        <TerminalMockup
          lines={CLI_LINES}
          label="~/projects"
          className="text-sm leading-6"
        />
      </div>
    </Section>
  )
}
