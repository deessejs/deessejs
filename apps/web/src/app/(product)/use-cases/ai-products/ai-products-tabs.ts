import type { UseCaseTab } from "../_components/use-case-tabs"

/**
 * Group 1 - the four existing AI products clusters, lifted
 * from the inline CAPABILITY_CLUSTERS array the page used
 * before the 4+4 refactor. Same order, same titles, same lead
 * lines (condensed to 1-sentence tab descriptions).
 *
 * Group 2 - four new "behind the curtain" pillars, invented
 * for the 4+4 mirrored layout: streaming cancel, citation
 * prompt, eval scoring, replay console. These are the runtime
 * half a buyer needs to ship an agent in production.
 */

export const GROUP_1: ReadonlyArray<UseCaseTab> = [
  {
    slug: "agent-loop",
    iconName: "MessageSquare",
    title: "Conversational agent",
    description:
      "The user-facing surface. How the agent talks to the user, and stays coherent past the first reply.",
  },
  {
    slug: "typed-tools",
    iconName: "Wrench",
    title: "Tool integration",
    description:
      "Where the agent stops being a chat and becomes useful. The contract surface where it touches the rest of the app.",
  },
  {
    slug: "pgvector-search",
    iconName: "Database",
    title: "Knowledge retrieval",
    description:
      "How the agent grounds itself in your domain, without re-training, without a second database.",
  },
  {
    slug: "otel-trace",
    iconName: "Activity",
    title: "Production operations",
    description:
      "How the agent stays correct, fast, and observable the day a customer files a support ticket about a wrong answer.",
  },
]

export const GROUP_2: ReadonlyArray<UseCaseTab> = [
  {
    slug: "streaming-cancel",
    iconName: "MessageSquare",
    title: "Streaming cancel",
    description:
      "Tokens flow over server-sent events, with mid-stream tool calls and a client-cancel hook that cleans up the run.",
  },
  {
    slug: "citation-prompt",
    iconName: "FileCode",
    title: "Citation prompt",
    description:
      "Retrieved chunks arrive with stable ids. The prompt cites each id inline so the user can audit what fed the answer.",
  },
  {
    slug: "eval-scoring",
    iconName: "LineChart",
    title: "Eval scoring",
    description:
      "Per-run graders and token or cost ceilings. A wrong answer cannot ship if the regression gate fails in CI.",
  },
  {
    slug: "replay-console",
    iconName: "Activity",
    title: "Replay console",
    description:
      "Every run has a trace id. Replay from the console with the same inputs, compare outputs, ship a fix without touching traffic.",
  },
]
