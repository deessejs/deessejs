import { githubChannel } from "eve/channels/github"

/**
 * GitHub channel for the DeesseJS mentionable agent.
 *
 * Bring-your-own credentials: the channel reads `GITHUB_APP_ID`,
 * `GITHUB_APP_PRIVATE_KEY`, and `GITHUB_WEBHOOK_SECRET` from the
 * environment (see `.env.example`).
 *
 * Dispatch behaviour: the default invocation-token gate is kept. The agent
 * only runs a turn when a comment on an issue, PR, or review thread
 * includes `@deessejs-agent`. Other GitHub events (issue opened, PR opened,
 * check suite completed, etc.) are ignored in this v1.
 */
export default githubChannel({
  botName: "deessejs-agent",
})
