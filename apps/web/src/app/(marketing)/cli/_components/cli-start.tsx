import Link from "next/link"

import { CLI_INSTALL_GUIDE_HREF } from "./cli-page-constants"
import { CLI_START_STEPS } from "./cli-start-data"

/**
 * The "démarrage" section: a 6-col grid (eyebrow + h2 + body on
 * the left, vertical 4-step list on the right) that walks the
 * visitor through installing the CLI and running their first
 * `init`. Replaces the previous horizontal 4-step grid, which
 * made `auth login` mandatory — `init` does not require auth.
 */
export function CliStart() {
  return (
    <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
      <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-2 lg:p-10">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Get started
        </p>
        <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
          Bring your first template into your workspace.
        </h2>
        <p className="max-w-md text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
          Four steps. Each command runs independently; copy and paste as you go.
        </p>
      </div>
      <ol className="grid grid-cols-1 divide-y divide-border lg:col-span-4 !p-0 border-0">
        {CLI_START_STEPS.map((step, idx) => (
          <li
            key={step.heading}
            className="flex flex-col gap-3 p-6 lg:p-8"
          >
            <span className="font-mono text-copy-13 text-muted-foreground">
              Step {String(idx + 1).padStart(2, "0")}
            </span>
            <h3 className="text-heading-20 font-medium tracking-tight text-foreground">
              {step.heading}
            </h3>
            <p className="text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
              {step.body}
            </p>
            <div className="flex flex-col gap-2">
              {step.commands.map((cmd) => (
                <code
                  key={cmd}
                  className="rounded bg-muted px-2 py-1 font-mono text-copy-12 text-foreground/90"
                >
                  $ {cmd}
                </code>
              ))}
            </div>
          </li>
        ))}
        <li className="flex items-center justify-end border-t border-border px-6 py-4 lg:px-8">
          <Link
            href={CLI_INSTALL_GUIDE_HREF}
            className="inline-flex items-center gap-1 text-label-13 text-foreground hover:underline underline-offset-4"
          >
            Read the full setup guide
            <span aria-hidden>↗</span>
          </Link>
        </li>
      </ol>
    </div>
  )
}
