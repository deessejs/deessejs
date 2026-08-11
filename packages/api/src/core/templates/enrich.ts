/**
 * Enrich the templates registry with live data from GitHub.
 *
 * Each registry entry declares an `owner/repo`. For every entry we hit
 * GitHub's REST API in parallel (see `../github/client.ts`) and merge
 * the response onto the entry. The result is the wire shape that the
 * CLI and apps/web consume (TemplateV1, see `@workspace/contracts/v1`).
 *
 * Failure mode: no cache, fail loud. If GitHub is unreachable or
 * rate-limited, the procedure translates the thrown error into a
 * stable 503 with code `templates_fetch_failed`.
 */
import type { TemplateV1 } from "@workspace/contracts/v1"
import { serverEnv } from "@workspace/env/server"
import { fetchReadme, fetchRepo } from "../github/client.js"
import type { GitHubRepo } from "../github/types.js"

export type EnrichedTemplate = TemplateV1

/**
 * Enrich each registry entry with live data from GitHub. Failures
 * (network, rate limit, 404 on the readme) throw — the caller is
 * expected to translate that into a 503 response.
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

      // Prefer the live repo name over the registry name when they differ.
      // In practice the registry name is editorial and matches the repo,
      // but this keeps the wire shape aligned with GitHub's canonical name.
      return {
        ...entry,
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
    }),
  )

  return enriched
}
