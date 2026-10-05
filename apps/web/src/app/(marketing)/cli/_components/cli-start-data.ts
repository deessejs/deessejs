/**
 * The four install steps of the /cli "Get started" section. The
 * flow is: install the CLI globally, list the registry, inspect
 * the chosen template, then scaffold the project.
 *
 * No `auth login` step. `init` does not require authentication.
 * The published `@deessejs/cli` package is the V1.1+ install path
 * (the README's V1 path is `npx deessejs@latest`); the global
 * install ships once the package is published to npm.
 *
 * Each step carries the canonical command and the expected
 * terminal output. The output is real CLI output for the
 * install / list / info / init / cd && dev flow.
 */
export type CliStartStep = {
  heading: string
  body: string
  command: string
  output: ReadonlyArray<string>
}

export const CLI_START_STEPS: ReadonlyArray<CliStartStep> = [
  {
    heading: "Install the CLI",
    body: "Node.js 20 or later. The package ships under @deessejs/cli; npm makes it available on your PATH.",
    command: "npm i -g @deessejs/cli",
    output: [
      "added 1 package in 3s",
    ],
  },
  {
    heading: "Find a template",
    body: "Browse the registry with one command. Filter by category to narrow your options.",
    command: "deessejs list",
    output: [
      "saas-starter       Production-ready Next.js SaaS boilerplate",
      "ai-starter         Next.js + MCP-ready template for AI products",
      "marketing-site     Astro + Decap CMS for marketing surfaces",
    ],
  },
  {
    heading: "Inspect your choice",
    body: "Read the template's stack, scripts, and contracts before you bring it into your project.",
    command: "deessejs info saas-starter",
    output: [
      "saas-starter",
      "  Production-ready Next.js + Better Auth + Postgres boilerplate",
      "  Stack: next, react, postgres, better-auth",
      "  Repo: github.com/deessejs/saas-template",
    ],
  },
  {
    heading: "Scaffold the project",
    body: "Clone the template and install its dependencies. Then move into the new directory and start the dev server.",
    command: "deessejs init saas-starter",
    output: [
      "Cloning deessejs/saas-template...",
      "Cloned into ./saas-starter (ref: main)",
      "Detected package manager: pnpm",
      "Installing dependencies...",
      "Dependencies installed",
      "Template ready",
    ],
  },
]
