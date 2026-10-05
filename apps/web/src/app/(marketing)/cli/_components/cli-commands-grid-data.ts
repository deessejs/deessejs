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
      /** One-line muted description (e.g. "Target directory override"). */
      description: string
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
    body: "Browse the registry. Filter by category to find the closest match.",
    example: "deessejs list --category saas",
  },
  {
    kind: "command",
    step: 2,
    name: "deessejs info <slug>",
    body: "Inspect one template. Stack, contracts, scripts. Use it before you scaffold.",
    example: "deessejs info saas-starter",
  },
  {
    kind: "command",
    step: 3,
    name: "deessejs init <slug>",
    body: "Clone the repo, install dependencies. The project is ready to start.",
    example: "deessejs init saas-starter",
  },
  {
    kind: "flag",
    title: "Override directory",
    description: "Override the target directory.",
    body: "Useful when the project lives in a subfolder of a monorepo.",
    flag: "--dir <path>",
    example: "deessejs init saas-starter --dir apps/web",
  },
  {
    kind: "flag",
    title: "Pin package manager",
    description: "Pin a package manager.",
    body: "Use it when the auto-detected one is wrong.",
    flag: "--pm <name>",
    example: "deessejs init saas-starter --pm bun",
  },
  {
    kind: "flag",
    title: "Clone only",
    description: "Skip the install step.",
    body: "Run the install command yourself, offline or in a constrained CI.",
    flag: "--no-install",
    example: "deessejs init saas-starter --no-install",
  },
]