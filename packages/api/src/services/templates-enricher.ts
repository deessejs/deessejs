/**
 * GitHub enricher for the templates registry.
 *
 * Each entry in the registry declares `owner` and `repo`. For every entry
 * we hit GitHub's REST API in parallel:
 *
 *   1. GET /repos/{owner}/{repo}             — name, description, license,
 *                                              stargazers_count, pushed_at,
 *                                              topics
 *   2. GET /repos/{owner}/{repo}/readme       — README markdown (base64)
 *
 * The two responses are merged onto the registry entry to produce the
 * wire shape that the CLI and apps/web consume (TemplateV1, see
 * `@workspace/contracts/v1`).
 *
 * Failure mode: no cache, fail loud. If GitHub is unreachable or rate-limited,
 * the templates endpoint returns 503 with a stable error code so the caller
 * can show a clear message. The registry entries are returned unchanged.
 *
 * Auth: the GITHUB_TOKEN env var (optional) lifts the anonymous rate limit
 * from 60 req/h to 5000 req/h. In production on Vercel, set this as a
 * project secret. Anonymous is enough for the V1 registry (3 entries).
 */
import type { TemplateV1 } from "@workspace/contracts/v1"
import { serverEnv } from "@workspace/env/server"

const GITHUB_API = "https://api.github.com"

type GitHubRepo = {
  name: string
  full_name: string
  description: string | null
  license: { spdx_id: string | null; name: string } | null
  stargazers_count: number
  pushed_at: string
  topics?: string[]
  html_url: string
}

type GitHubReadme = {
  content: string
  encoding: "base64"
}

const headers = (token: string | undefined): Record<string, string> => {
  const base: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "deessejs-api",
  }
  if (token) base.Authorization = `Bearer ${token}`
  return base
}

const fetchRepo = async (
  owner: string,
  repo: string,
  token: string | undefined,
): Promise<GitHubRepo> => {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
    headers: headers(token),
  })
  if (!response.ok) {
    throw new Error(
      `GitHub /repos/${owner}/${repo} returned ${response.status}`,
    )
  }
  return response.json() as Promise<GitHubRepo>
}

const fetchReadme = async (
  owner: string,
  repo: string,
  token: string | undefined,
): Promise<string | undefined> => {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/readme`,
    { headers: headers(token) },
  )
  if (response.status === 404) return undefined
  if (!response.ok) {
    throw new Error(
      `GitHub /repos/${owner}/${repo}/readme returned ${response.status}`,
    )
  }
  const payload = (await response.json()) as GitHubReadme
  if (payload.encoding !== "base64") return undefined
  // GitHub returns base64 with embedded newlines every 60 chars.
  return Buffer.from(payload.content, "base64").toString("utf8")
}

export type EnrichedTemplate = TemplateV1

/**
 * Enrich each registry entry with live data from GitHub. Failures
 * (network, rate limit, 404) throw — the caller is expected to
 * translate that into a 503 response.
 */
export async function enrich(
  registry: ReadonlyArray<TemplateV1>,
): Promise<EnrichedTemplate[]> {
  const token = serverEnv.GITHUB_TOKEN

  const enriched = await Promise.all(
    registry.map(async (entry): Promise<EnrichedTemplate> => {
      const [repo, readme] = await Promise.all([
        fetchRepo(entry.owner, entry.repo, token),
        fetchReadme(entry.owner, entry.repo, token),
      ])

      const enrichedEntry: EnrichedTemplate = {
        ...entry,
        // Prefer the live repo name over the registry name when they differ.
        // In practice the registry name is editorial and matches the repo,
        // but this keeps the wire shape aligned with GitHub's canonical name.
        name: repo.name,
        description: repo.description ?? entry.description,
        license:
          repo.license?.spdx_id ??
          repo.license?.name ??
          entry.license,
        labels: repo.topics && repo.topics.length > 0 ? repo.topics : entry.labels,
        updatedAt: repo.pushed_at,
        stars: repo.stargazers_count,
        readme,
        cloneUrl: repo.html_url,
      }
      return enrichedEntry
    }),
  )

  return enriched
}
