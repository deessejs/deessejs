import Link from "next/link"

import { Section } from "@/app/(marketing)/_components/section"
import { SectionHeader } from "@/app/(marketing)/_components/section-header"

import { CLI_INSTALL_GUIDE_HREF } from "./cli-page-constants"
import { CLI_START_STEPS } from "./cli-start-data"

/**
 * The "Get started" section. Same visual rhythm as the homepage
 * Ecosystem section: a `<SectionHeader>` on top, then a vertical
 * list of 4 cells. Each cell is a 2-col split (explanation on
 * the left, a terminal-style code block on the right showing
 * the command and its expected output).
 *
 * Mirrors the pattern: the visitor reads what the step does,
 * sees the exact command to run, and the actual output they
 * should expect in their terminal.
 *
 * `init` does not require auth, so no `auth login` step.
 */
export function CliStart({ id }: { id?: string } = {}) {
  return (
    <Section {...(id ? { id } : {})}>
      <SectionHeader
        eyebrow="Get started"
        title="Bring your first template into your workspace."
        subtitle="Four steps. Each command runs independently; copy and paste as you go."
        bordered={true}
      />
      <ol className="grid grid-cols-1 divide-y divide-border border-0 !p-0">
        {CLI_START_STEPS.map((step, idx) => (
          <li
            key={step.heading}
            className="grid grid-cols-1 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0"
          >
            {/* Left: explanation */}
            <div className="flex flex-col gap-3 p-6 lg:p-8">
              <span className="font-mono text-copy-13 text-muted-foreground">
                Step {String(idx + 1).padStart(2, "0")}
              </span>
              <h3 className="text-heading-20 font-medium tracking-tight text-foreground">
                {step.heading}
              </h3>
              <p className="text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
                {step.body}
              </p>
            </div>

            {/* Right: terminal-style code block with command + expected output */}
            <div className="flex flex-col gap-0 bg-muted/30 p-6 lg:p-8">
              <code className="font-mono text-copy-13 text-foreground/90">
                $ {step.command}
              </code>
              {step.output.map((line, i) => (
                <span
                  key={i}
                  className="font-mono text-copy-13 text-muted-foreground"
                >
                  {line}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <div className="flex items-center justify-end border-t border-border px-6 py-4 lg:px-8">
        <Link
          href={CLI_INSTALL_GUIDE_HREF}
          className="inline-flex items-center gap-1 text-label-13 text-foreground hover:underline underline-offset-4"
        >
          Read the full setup guide
          <span aria-hidden>↗</span>
        </Link>
      </div>
    </Section>
  )
}
