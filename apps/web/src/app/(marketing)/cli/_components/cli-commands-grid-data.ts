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
    body: "Browse available templates from your terminal. The CLI prints a four-column table (slug, name, category, license) for every template. Filter by category to narrow your options.",
    example: "deessejs list --category saas",
  },
  {
    kind: "command",
    step: 2,
    name: "deessejs info <slug>",
    body: "Check one template's description, category, license, and repository before initializing your project. The output is a key-value block; the actual stack lives in the cloned README.",
    example: "deessejs info saas-starter",
  },
  {
    kind: "command",
    step: 3,
    name: "deessejs init <slug>",
    body: "Clone the selected template into a local directory named after the slug, then run the package manager install command the CLI detects. Service credentials and follow-up configuration live in the cloned README.",
    example: "deessejs init saas-starter",
  },
  {
    kind: "flag",
    title: "Choose the project directory",
    body: "Pick a directory for the cloned repo. The default is a folder named after the slug in the current working directory; the flag replaces that path when you need a non-default location.",
    flag: "--dir <path>",
    example: "deessejs init saas-starter --dir ./my-app",
  },
  {
    kind: "flag",
    title: "Override package manager",
    body: "Pin the install command. The default detects the package manager from the cloned repo's lockfile or packageManager field. Accepted values are npm, pnpm, yarn, or bun.",
    flag: "--pm <name>",
    example: "deessejs init saas-starter --pm bun",
  },
  {
    kind: "flag",
    title: "Clone only",
    body: "Clone the repository without installing dependencies. Run installation separately when the network is up or when the CI environment can fetch packages faster than the CLI.",
    flag: "--no-install",
    example: "deessejs init saas-starter --no-install",
  },
]