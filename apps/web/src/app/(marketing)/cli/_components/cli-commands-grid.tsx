import { CLI_COMMANDS_GRID } from "./cli-commands-grid-data"

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
 * Layout: two stacked 3-col grids, one per row. The 2nd grid
 * carries a `border-t border-border` on `lg+` so a 1px line
 * separates the two rows. On mobile the grid is single-column
 * with `divide-y divide-border` between every cell.
 */
export function CliCommandsGrid() {
  const commands = CLI_COMMANDS_GRID.filter((c) => c.kind === "command")
  const flags = CLI_COMMANDS_GRID.filter((c) => c.kind === "flag")

  return (
    <div className="flex flex-col">
      {/* Row 1 : the three commands */}
      <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {commands.map((cell, idx) => {
          const command = cell as Extract<typeof cell, { kind: "command" }>
          return (
            <div
              key={`command-${idx}`}
              className="flex flex-col gap-3 p-6 lg:p-8"
            >
              <span className="font-mono text-copy-13 text-muted-foreground">
                Step {String(command.step).padStart(2, "0")}
              </span>
              <h3 className="font-mono text-copy-16 font-medium text-foreground !m-0">
                {command.name}
              </h3>
              <p className="text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
                {command.body}
              </p>
              <code className="mt-1 rounded bg-muted px-2 py-1 font-mono text-copy-12 text-foreground/90">
                $ {command.example}
              </code>
            </div>
          )
        })}
      </div>

      {/* Row 2 : the three flags, separated from row 1 by a 1px border */}
      <div className="grid grid-cols-1 divide-y divide-border border-t border-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {flags.map((cell, idx) => {
          const flag = cell as Extract<typeof cell, { kind: "flag" }>
          return (
            <div
              key={`flag-${idx}`}
              className="flex flex-col gap-3 p-6 lg:p-8"
            >
              <span className="font-mono text-copy-13 text-muted-foreground">
                {flag.flag}
              </span>
              <p className="text-copy-14 leading-6 text-foreground [&:not(:first-child)]:mt-0">
                {flag.body}
              </p>
              <code className="mt-1 rounded bg-muted px-2 py-1 font-mono text-copy-12 text-foreground/90">
                $ {flag.example}
              </code>
            </div>
          )
        })}
      </div>
    </div>
  )
}