import { defineTool } from "eve/tools"
import { z } from "zod"

import { getInstallationOctokit } from "../lib/octokit-app.js"

const OWNER_REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/

const BODY_PREVIEW_CHARS = 2_000

/**
 * Pre-publication dedup helper. Returns the top 10 audit-labelled open
 * issues whose titles or bodies match the query, *with their bodies
 * included* (truncated to BODY_PREVIEW_CHARS) so the specialist can read
 * the existing evidence before deciding whether to publish a duplicate.
 *
 * The specialist must read the matches' bodies and decide whether the
 * new finding is genuinely distinct; the search itself is not a verdict.
 */
export default defineTool({
  description:
    "Search the repository's open audit-labelled issues by free-text " +
    "query. Returns up to 10 matches with their numbers, titles, URLs, " +
    "state, and a truncated body preview. Use before create_audit_issue " +
    "to verify the defect is not already tracked.",
  inputSchema: z.object({
    installationId: z.number().int().positive(),
    repository: z.string().regex(OWNER_REPO_RE),
    query: z.string().min(8),
  }),
  async execute({ installationId, repository, query }) {
    const [owner, repo] = repository.split("/")
    if (!owner || !repo) throw new Error("repository must be owner/name")
    const octokit = await getInstallationOctokit(installationId)
    const { data } = await octokit.rest.search.issuesAndPullRequests({
      q: `repo:${owner}/${repo} is:issue is:open label:audit ${query}`,
      per_page: 10,
    })
    return data.items.map((i) => ({
      number: i.number,
      title: i.title,
      url: i.html_url,
      state: i.state,
      bodyPreview: (i.body ?? "").slice(0, BODY_PREVIEW_CHARS),
      labels: i.labels.map((l) => (typeof l === "string" ? l : l.name ?? "")),
      updatedAt: i.updated_at,
    }))
  },
})