import { defineTool } from "eve/tools"
import { z } from "zod"

import { getInstallationOctokit } from "../lib/octokit-app.js"

const OWNER_REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/

/**
 * Pre-publication dedup helper. The specialist calls this before
 * create_audit_issue to read the top 10 audit-labelled issues whose
 * titles or bodies match the query. The specialist decides, from the
 * matches' evidence, whether the new finding is genuinely distinct.
 */
export default defineTool({
  description:
    "Search the repository's open audit-labelled issues by free-text " +
    "query. Returns up to 10 matches with their numbers, titles, URLs, " +
    "and state. Use before create_audit_issue to verify the defect is " +
    "not already tracked.",
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
      q: `repo:${owner}/${repo} is:issue label:audit ${query}`,
      per_page: 10,
    })
    return data.items.map((i) => ({
      number: i.number,
      title: i.title,
      url: i.html_url,
      state: i.state,
    }))
  },
})