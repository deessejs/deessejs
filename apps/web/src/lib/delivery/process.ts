/**
 * Four engineering protocols for the /delivery page.
 *
 * Each row kills one specific concern a CTO has when buying
 * outside engineering: async-first kills meeting overhead, PRs
 * directly in your repo kill visibility concerns, IP transfer
 * kills vendor lock-in, code handover kills the "we depend on
 * the consultant forever" trap.
 */
export type ProcessStep = {
  number: string
  title: string
  body: string
}

export const PROCESS_STEPS: ReadonlyArray<ProcessStep> = [
  {
    number: "01",
    title: "Async-first & Slack Connect",
    body:
      "No unnecessary meetings. We join your Slack or Discord. Follow-up happens via async Loom videos and Linear tickets.",
  },
  {
    number: "02",
    title: "Pull Requests directly in your GitHub",
    body:
      "We don't build on our machine and send you a zip at the end. We open PRs directly on your repository. Your engineers see every commit.",
  },
  {
    number: "03",
    title: "Day 1 IP transfer",
    body:
      "Every line of code written for you is yours from the first commit. 100% IP ownership, zero royalty claims, zero vendor lock-in.",
  },
  {
    number: "04",
    title: "Transparent code handover",
    body:
      "At the end of the engagement, we run an in-depth code review session with your developers so they are 100% autonomous for what comes next.",
  },
]
