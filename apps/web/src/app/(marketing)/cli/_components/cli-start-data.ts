/**
 * The four install steps of the /cli "démarrage" section. The
 * flow is: install the CLI globally, list the registry, inspect
 * the chosen template, then scaffold the project.
 *
 * No `auth login` step — `init` does not require authentication.
 * The published `@deessejs/cli` package is the V1.1+ install path
 * (the README's V1 path is `npx deessejs@latest`); the global
 * install ships once the package is published to npm.
 */
export type CliStartStep = {
  heading: string
  body: string
  commands: ReadonlyArray<string>
}

export const CLI_START_STEPS: ReadonlyArray<CliStartStep> = [
  {
    heading: "Install the CLI",
    body: "Node.js 20 or later. The package ships under @deessejs/cli; npm makes it available on your PATH.",
    commands: ["npm i -g @deessejs/cli"],
  },
  {
    heading: "Find a template",
    body: "Browse the registry with one command. Filter by category to narrow your options.",
    commands: ["deessejs list"],
  },
  {
    heading: "Inspect your choice",
    body: "Read the template's stack, scripts, and contracts before you bring it into your project.",
    commands: ["deessejs info saas-starter"],
  },
  {
    heading: "Scaffold the project",
    body: "Clone the template and install its dependencies. Then move into the new directory and start the dev server.",
    commands: ["deessejs init saas-starter", "cd saas-starter && pnpm dev"],
  },
]
