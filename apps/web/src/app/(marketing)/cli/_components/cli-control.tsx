import Link from "next/link"

import { CLI_CONTROL_FLAGS } from "./cli-control-data"

const FULL_OPTIONS_HREF = "/knowledge-base/guides/install-deessejs-cli"

/**
 * The "contrôle" section: three useful `init` flags the visitor
 * should know about, each with a one-line use case and a
 * copy-pasteable example. Other flags (`--ref`, `--force`,
 * `--json`) live in the full reference guide.
 */
export function CliControl() {
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {CLI_CONTROL_FLAGS.map((flag) => (
          <div
            key={flag.flag}
            className="flex flex-col gap-3 p-6 lg:p-8"
          >
            <span className="font-mono text-copy-13 text-muted-foreground">
              {flag.flag}
            </span>
            <p className="text-copy-14 leading-6 text-foreground [&:not(:first-child)]:mt-0">
              {flag.body}
            </p>
            <code className="mt-1 rounded bg-muted px-2 py-1 font-mono text-copy-12 text-foreground/90">
              $ {flag.command}
            </code>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end border-t border-border px-6 py-4 lg:px-8">
        <Link
          href={FULL_OPTIONS_HREF}
          className="inline-flex items-center gap-1 text-label-13 text-foreground hover:underline underline-offset-4"
        >
          View all CLI options
          <span aria-hidden>↗</span>
        </Link>
      </div>
    </div>
  )
}
