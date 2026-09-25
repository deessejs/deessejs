import githubExtension from "@github-tools/eve-extension"

/**
 * Mounts the GitHub tools extension for the DeesseJS mentionable agent.
 *
 * Provides two presets:
 *   - `code-review`: read PRs/files/commits, comment on review threads,
 *     request reviewers, resolve threads, and submit reviews. Writes
 *     (comments, reviews, request_reviewers) gate on `always()` by default.
 *   - `issue-triage`: list/get/create/update issues, add/remove labels,
 *     comment on issues, manage assignees. Writes gate on `always()` by
 *     default.
 *
 * Authentication falls back to `process.env.GITHUB_TOKEN` (a fine-grained
 * PAT). When the agent runs in response to a GitHub webhook, the eve
 * GitHub channel's installation token can be preferred via the Vercel
 * Connect path (out of scope for this v1).
 *
 * All tools become available to the model under the `github__` namespace
 * (e.g. `github__getPullRequest`, `github__listIssues`).
 */
export default githubExtension({
  preset: ["code-review", "issue-triage"],
  context: {
    owner: "deessejs",
    repo: "deessejs",
  },
})
