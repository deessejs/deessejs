/**
 * Three canonical commands exposed by `@deessejs/cli`, lifted from
 * `apps/cli/src/commands/{init,list,info}.ts` and the README at
 * `apps/cli/README.md`. The marketing `/cli` page renders one card
 * per command. Names match the Commander `Command("init" | "list"
 * | "info")` declarations; descriptions match
 * `Command(...).description(...)`; flags are the full canonical
 * flag surface declared on each command.
 *
 * Adding a fourth command: append the row here and re-export from
 * the page. Do not invent flags that don't exist in the CLI
 * source. This is the marketing surface that tells users what
 * they can actually type.
 */

export type CliCommandCard = Readonly<{
  /** Command invocation, e.g. `deessejs init <slug>`. Mono in UI. */
  name: string
  /** What the command does. Pulled verbatim from the .description() call. */
  description: string
  /** Canonical example the user can copy. Mono in UI. */
  example: string
  /** All flags exposed by the command, in declaration order. */
  flags: ReadonlyArray<string>
}>

export const CLI_COMMANDS: ReadonlyArray<CliCommandCard> = [
  {
    name: "deessejs init <slug>",
    description: "Clone a template repo + install dependencies",
    example: "deessejs init saas-starter",
    flags: [
      "--pm <name>",
      "--dir <path>",
      "--ref <branch>",
      "--no-install",
      "--force",
      "--json",
    ],
  },
  {
    name: "deessejs list",
    description: "List available templates",
    example: "deessejs list --category saas --json",
    flags: ["--category <name>", "--json"],
  },
  {
    name: "deessejs info <slug>",
    description: "Show details for one template",
    example: "deessejs info saas-starter --json",
    flags: ["--json"],
  },
]