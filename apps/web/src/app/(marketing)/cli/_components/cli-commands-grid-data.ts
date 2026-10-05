/**
 * Unified data for the CLI "commands + flags" grid on /cli.
 *
 * Three commands in the order a developer actually uses them
 * (`list`, `info`, `init`) and three useful `init` flags
 * (`--dir`, `--pm`, `--no-install`) laid out in a single 2-col
 * bento grid. Commands on the left (the flow), flags on the
 * right (the customisation).
 *
 * The other `init` flags (`--ref`, `--force`, `--json`) live in
 * the full reference guide.
 */
export type CliCommandCell =
  | {
      kind: "command"
      /** 1-based step number, padded to two digits. */
      step: number
      /** The command invocation (e.g. `deessejs list`). */
      name: string
      body: string
      /** Canonical example the visitor copies to their terminal. */
      example: string
    }
  | {
      kind: "flag"
      /** Short human-readable title for the flag (e.g. "Override directory"). */
      title: string
      /** The flag invocation (e.g. `--dir <path>`). */
      flag: string
      body: string
      /** Canonical example the visitor copies. */
      example: string
    }

export const CLI_COMMANDS_GRID: ReadonlyArray<CliCommandCell> = [
  {
    kind: "command",
    step: 1,
    name: "deessejs list",
    body: "Browse available templates. Filter by category to find a starting point for your project.",
    example: "deessejs list --category saas",
  },
  {
    kind: "command",
    step: 2,
    name: "deessejs info <slug>",
    body: "Check a template's description, category, license, and repository before initializing your project.",
    example: "deessejs info saas-starter",
  },
  {
    kind: "command",
    step: 3,
    name: "deessejs init <slug>",
    body: "Clone the selected template into a local directory and install its dependencies. Follow its README to complete setup.",
    example: "deessejs init saas-starter",
  },
  {
    kind: "flag",
    title: "Choose the project directory",
    body: "Pick a directory instead of using the template's slug.",
    flag: "--dir <path>",
    example: "deessejs init saas-starter --dir ./my-app",
  },
  {
    kind: "flag",
    title: "Override package manager",
    body: "Override automatic detection with npm, pnpm, Yarn, or Bun.",
    flag: "--pm <name>",
    example: "deessejs init saas-starter --pm bun",
  },
  {
    kind: "flag",
    title: "Clone only",
    body: "Clone the repository without installing dependencies. Run installation separately when you are ready.",
    flag: "--no-install",
    example: "deessejs init saas-starter --no-install",
  },
]