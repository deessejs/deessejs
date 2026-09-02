/**
 * Enrich the templates registry with live data from GitHub.
 *
 * Each registry entry declares an `owner/repo`. For every entry we hit
 * GitHub's REST API in parallel (see `../github/client.ts`) and merge
 * the response onto the entry. The result is the wire shape that the
 * CLI and apps/web consume (TemplateV1, see `@workspace/contracts/v1`).
 *
 * Failure mode: no cache, fail loud. If GitHub is unreachable,
 * rate-limited, or returns an unexpected status, this function
 * rejects with a plain `Error`. The caller
 * (`packages/api/src/orpc/routes/templates.ts`) translates that
 * into a stable `ORPCError` with code `TEMPLATES_FETCH_FAILED`
 * (HTTP 502, Bad Gateway) so the typed client can distinguish an
 * upstream-GitHub failure from a genuine server bug.
 *
 * Wire-shape invariants (defensive):
 *
 *   - `labels` is ALWAYS a `string[]` on the emitted payload. If GitHub
 *     returns no topics and the registry entry has none either, we emit
 *     `[]` rather than `undefined`. The downstream `TemplateLabels`
 *     component on apps/web reads `labels.length` directly and a
 *     missing field crashes the SSR render with
 *     `TypeError: Cannot read properties of undefined (reading 'length')`
 *     (prod digest `551940582`). Normalising here is cheaper than a
 *     runtime check at every consumer.
 *   - `license` falls back through `repo.license?.spdx_id ?? .name ??
 *     entry.license` so the field is always present (the contract
 *     requires it as `string`, not `string | undefined`).
 */
import type { TemplateV1 } from "@workspace/contracts/v1"
import { serverEnv } from "@workspace/env/server"
import { fetchReadme, fetchRepo } from "../github/client.js"

export type EnrichedTemplate = TemplateV1

/**
 * Resolve the `labels` field to a guaranteed `string[]`.
 *
 * Preference order:
 *   1. `repo.topics` when GitHub returns at least one topic.
 *   2. `entry.labels` when the registry author curated labels.
 *   3. `[]` as the final fallback. Never `undefined`.
 *
 * Exported for unit testing — see `packages/api/tests/unit/enrich.test.ts`.
 */
export const resolveLabels = (
  repoTopics: string[] | undefined,
  entryLabels: string[] | undefined,
): string[] => {
  if (Array.isArray(repoTopics) && repoTopics.length > 0) return repoTopics
  if (Array.isArray(entryLabels)) return entryLabels
  return []
}

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
        labels: resolveLabels(repo.topics, entry.labels),
        updatedAt: repo.pushed_at,
        stars: repo.stargazers_count,
        readme,
        cloneUrl: repo.html_url,
      }
    }),
  )

  return enriched
}
