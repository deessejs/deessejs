import Link from "next/link"

import { CLI_COMMANDS_GRID } from "./cli-commands-grid-data"

const FULL_OPTIONS_HREF = "/knowledge-base/guides/install-deessejs-cli"

/**
 * The unified CLI "commands + flags" grid on /cli. A single
 * 2-row bento that interleaves the three commands
 * (list → info → init) in the top row with the three useful
 * `init` flags (--dir, --pm, --no-install) in the bottom row.
 *
 * Replaces the previous two sections (Parcours + Contrôle)
 * that were rendered as separate `<Section>` blocks with
 * duplicated headers. Same content, one rhythm.
 *
 * Layout: 2 rows × 3 cols on `lg+` (commands top, flags
 * bottom); single column on mobile with `divide-y divide-border`.
 */
export function CliCommandsGrid() {
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {CLI_COMMANDS_GRID.map((cell, idx) => {
          const isFirst = idx === 0
          return (
            <div
              key={isFirst ? "command-1" : cell.kind === "command" ? `command-${cell.step}` : `flag-${cell.flag}`}
              className="flex flex-col gap-3 p-6 lg:p-8"
            >
              {cell.kind === "command" ? (
                <>
                  <span className="font-mono text-copy-13 text-muted-foreground">
                    Step {String(cell.step).padStart(2, "0")}
                  </span>
                  <h3 className="font-mono text-copy-16 font-medium text-foreground !m-0">
                    {cell.name}
                  </h3>
                  <p className="text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
                    {cell.body}
                  </p>
                  <code className="mt-1 rounded bg-muted px-2 py-1 font-mono text-copy-12 text-foreground/90">
                    $ {cell.example}
                  </code>
                </>
              ) : (
                <>
                  <span className="font-mono text-copy-13 text-muted-foreground">
                    {cell.flag}
                  </span>
                  <p className="text-copy-14 leading-6 text-foreground [&:not(:first-child)]:mt-0">
                    {cell.body}
                  </p>
                  <code className="mt-1 rounded bg-muted px-2 py-1 font-mono text-copy-12 text-foreground/90">
                    $ {cell.example}
                  </code>
                </>
              )}
            </div>
          )
        })}
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