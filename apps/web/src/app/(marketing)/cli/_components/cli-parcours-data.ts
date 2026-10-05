/**
 * The three commands of the /cli "parcours" section, in the order
 * a developer actually uses them: discover, inspect, then scaffold.
 *
 * The `name` is the command (rendered as a mono label). The
 * `body` explains what the command does. The `command` field is
 * the canonical example the visitor copies to their terminal.
 */
export type CliParcoursStep = {
  name: string
  body: string
  command: string
}

export const CLI_PARCOURS: ReadonlyArray<CliParcoursStep> = [
  {
    name: "deessejs list",
    body: "Browse the registry. Filter by category to find the closest match.",
    command: "deessejs list --category saas",
  },
  {
    name: "deessejs info <slug>",
    body: "Inspect one template. Stack, contracts, scripts. Use it before you scaffold.",
    command: "deessejs info saas-starter",
  },
  {
    name: "deessejs init <slug>",
    body: "Clone the repo, install dependencies. The project is ready to start.",
    command: "deessejs init saas-starter",
  },
]
