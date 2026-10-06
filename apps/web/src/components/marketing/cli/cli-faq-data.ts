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
      "No. The selected template ships a .env.example with the credentials it expects. You bring the accounts; the template wires the SDKs. Service configuration happens after the CLI has finished.",
  },
  {
    question: "Can I change the generated code?",
    answer:
      "Yes. You can inspect and edit the source files locally. Follow the selected template's license, and update its documentation as your project evolves.",
  },
]
