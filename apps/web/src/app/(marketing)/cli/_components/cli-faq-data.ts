/**
 * The three most common questions a first-time visitor to /cli
 * asks. Each answer is short and points back to the template
 * rather than the CLI for setup / configuration concerns.
 */
export type CliFaqItem = {
  question: string
  answer: string
}

export const CLI_FAQ: ReadonlyArray<CliFaqItem> = [
  {
    question: "What does the CLI set up?",
    answer:
      "The CLI clones the selected template's repo into a local directory named after the slug, detects your package manager (pnpm, npm, yarn, or bun), and runs the install command. The CLI does not start the dev server. That is a separate command inside the cloned project.",
  },
  {
    question: "Does the CLI configure external services?",
    answer:
      "No. The CLI scaffolds a project whose .env.example lists the keys you need (Postgres, Stripe, Resend, Better Auth, etc.). You bring the accounts; the templates wire the SDKs.",
  },
  {
    question: "Can I change the generated code?",
    answer:
      "Yes. The templates are scaffolds, not sealed images. Edit anything: rename the app, swap the auth provider, replace the database. The conventions (typed contracts, AGENTS.md, monorepo layout) stay stable so a coding agent on a fresh clone still navigates it the same way.",
  },
]
