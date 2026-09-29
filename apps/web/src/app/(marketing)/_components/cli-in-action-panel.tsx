"use client"

import * as m from "motion/react-m"
import { LazyMotion, domAnimation, useReducedMotion } from "motion/react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { CopyCommandButton } from "./copy-command-button"

/**
 * CLI section transformation panel.
 *
 * Three columns (Template · Init · Project) inside the shared-border
 * chrome (`border border-border bg-background`). The columns are
 * connected by inline chevron arrows that fade in on first
 * viewport entry — once, no loop, respects `prefers-reduced-motion`.
 *
 * Source-of-truth: the steps in the Init cell mirror exactly what
 * `apps/cli/src/commands/init.ts` does today — clone the template
 * repo, detect the package manager, install dependencies. There is
 * no `--template` flag (the slug is positional) and the CLI does
 * not write AGENTS.md or mcp.json — those files, when present in the
 * Project cell, come from the cloned template.
 *
 * `info` is positioned as the *post-init* inspection command, not a
 * peer of `init`. It reads template metadata from the registry,
 * matching `apps/cli/src/commands/info.ts`.
 */
export function CliInActionPanel({
  command,
  installGuideHref,
}: {
  /** The exact command to display and copy. */
  command: string
  /** Link target for the CTA below the panel. */
  installGuideHref: string
}) {
  const reduceMotion = useReducedMotion()

  // Three-time Motion choreography: command → flow (cells + arrows)
  // → result (Project contents). Total ~1.2s, plays once.
  const flowVariants = {
    hidden: {},
    visible: {
      transition: reduceMotion
        ? {}
        : { staggerChildren: 0.1, delayChildren: 0.15 },
    },
  }

  const cellVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
    },
  }

  const commandVariants = {
    hidden: { opacity: 0, y: 4 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
    },
  }

  const resultVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: reduceMotion
        ? { duration: 0 }
        : { duration: 0.4, delay: 0.55, ease: "easeOut" as const },
    },
  }

  const arrowVariants = (delay: number) => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.2, delay },
    },
  })

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex flex-col border border-border bg-background">
        {/* Row 1 — the command itself */}
        <div className="flex flex-col gap-3 border-b border-border p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex flex-col gap-2">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              What this command does
            </p>
            <m.code
              variants={commandVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              className="font-mono text-copy-14 leading-6 text-foreground"
            >
              $ {command}
            </m.code>
          </div>
          <CopyCommandButton command={command} />
        </div>

        {/* Row 2 — three-cell transformation */}
        <m.div
          variants={flowVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          className="grid grid-cols-1 divide-y divide-border md:grid-cols-[2fr_3fr_5fr] md:divide-x md:divide-y-0"
        >
          {/* TEMPLATE cell */}
          <m.div
            variants={cellVariants}
            className="flex flex-col gap-3 p-6 md:p-8"
          >
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Template
            </p>
            <p className="font-mono text-copy-14 leading-6 text-foreground">
              saas-starter
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {["Next.js", "Better Auth", "Drizzle", "Stripe"].map(
                (tech) => (
                  <li
                    key={tech}
                    className="inline-flex items-center border border-border bg-background px-2 py-0.5 font-mono text-label-12 text-foreground"
                  >
                    {tech}
                  </li>
                ),
              )}
            </ul>
          </m.div>

          {/* INIT cell — chevron on the left edge */}
          <m.div
            variants={cellVariants}
            className="relative flex flex-col gap-3 p-6 md:p-8"
          >
            <m.span
              aria-hidden
              variants={arrowVariants(0.45)}
              className="absolute -left-2 top-1/2 hidden -translate-y-1/2 text-foreground md:block"
            >
              <ArrowRight className="size-3" />
            </m.span>
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Init does
            </p>
            <ol className="flex flex-col gap-2 text-copy-14 leading-6 text-foreground">
              <li className="flex items-baseline gap-2">
                <span
                  aria-hidden
                  className="font-mono text-label-12 text-muted-foreground"
                >
                  1.
                </span>
                <span>Clone the template repo</span>
              </li>
              <li className="flex items-baseline gap-2">
                <span
                  aria-hidden
                  className="font-mono text-label-12 text-muted-foreground"
                >
                  2.
                </span>
                <span>Detect your package manager</span>
              </li>
              <li className="flex items-baseline gap-2">
                <span
                  aria-hidden
                  className="font-mono text-label-12 text-muted-foreground"
                >
                  3.
                </span>
                <span>Install dependencies</span>
              </li>
            </ol>
          </m.div>

          {/* PROJECT cell — chevron on the left edge, result reveal */}
          <m.div
            variants={cellVariants}
            className="relative flex flex-col gap-3 p-6 md:p-8"
          >
            <m.span
              aria-hidden
              variants={arrowVariants(0.6)}
              className="absolute -left-2 top-1/2 hidden -translate-y-1/2 text-foreground md:block"
            >
              <ArrowRight className="size-3" />
            </m.span>
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Project
            </p>
            <m.pre
              variants={resultVariants}
              className="overflow-x-auto font-mono text-copy-13 leading-6 text-foreground"
            >
              {`saas-starter/
├── package.json
├── AGENTS.md
└── mcp.json`}
            </m.pre>
            <m.p
              variants={resultVariants}
              className="text-label-13 text-muted-foreground"
            >
              Ready to <span className="font-mono">cd</span> and run.
            </m.p>
          </m.div>
        </m.div>

        {/* Row 3 — post-init inspection */}
        <div className="flex flex-col gap-3 border-t border-border p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex flex-col gap-1">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              After init, inspect with
            </p>
            <code className="font-mono text-copy-14 leading-6 text-foreground">
              $ deessejs info saas-starter
            </code>
          </div>
          <Link
            href={installGuideHref}
            className="inline-flex items-center gap-1.5 self-start text-label-13 font-medium text-foreground hover:underline underline-offset-4 md:self-auto"
          >
            Read the CLI guide
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </div>
      </div>
    </LazyMotion>
  )
}
