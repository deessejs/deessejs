/**
 * Enrich the templates registry with live data from GitHub.
 *
 * Each registry entry is a pointer: an `owner/repo` pair. For every
 * pointer we hit GitHub's REST API in parallel (see
 * `../github/client.ts`) and read three things:
 *
 *   - the repository metadata, for the name, the licence, the topics,
 *     the last push and the star count
 *   - the readme, which is served as raw markdown
 *   - the template manifest, `deesse-template.json`, which carries the
 *     slug, the title, the description, the licence, the category and
 *     the labels
 *
 * The manifest is the source of truth for the product fields. This is
 * the rule of the template standard: the catalogue never keeps a second
 * copy of a fact that is versioned with the repository. The live
 * repository fills the gaps the manifest leaves open.
 *
 * Failure mode: no cache, fail loud. If GitHub is unreachable,
 * rate-limited, or returns an unexpected status, this function rejects
 * with a plain `Error`. The caller
 * (`packages/api/src/orpc/routes/templates.ts`) translates that
 * into a stable `ORPCError` with code `TEMPLATES_FETCH_FAILED`
 * (HTTP 502, Bad Gateway) so the typed client can distinguish an
 * upstream-GitHub failure from a genuine server bug.
 *
 * A template whose manifest is missing, unreadable, or incomplete is
 * not published. The catalogue has no copy of the product fields to
 * publish for it, so the row is skipped and the skip is logged. That
 * is the one expected and non fatal skip. Everything else throws.
 *
 * Wire-shape invariants (defensive):
 *
 *   - `labels` is ALWAYS a `string[]` on the emitted payload. The
 *     `TemplateLabels` component on apps/web reads `labels.length`
 *     directly and a missing field crashes the SSR render with
 *     `TypeError: Cannot read properties of undefined (reading 'length')`
 *     (prod digest `551940582`). The invariant lives in
 *     `resolveLabels`, see `manifest.ts`.
 *   - `license` falls back through `manifest.license ?? repo.license`
 *     so the field is always present (the contract requires it as
 *     `string`, not `string | undefined`).
 */
import { serverEnv } from "@workspace/env/server"
import { logger } from "../../constants/logger.js"
import { fetchManifest, fetchReadme, fetchRepo } from "../github/client.js"
import {
  mergeManifest,
  parseManifest,
  type MergedTemplate,
  type TemplatePointer,
} from "./manifest.js"

export type EnrichedTemplate = MergedTemplate

export { resolveLabels } from "./manifest.js"

/**
 * Enrich each registry pointer with live data from GitHub and with the
 * template manifest. Failures (network, rate limit, unexpected status)
 * throw. A template with no usable manifest is skipped and logged.
 */
export async function enrich(
  registry: ReadonlyArray<TemplatePointer>,
): Promise<EnrichedTemplate[]> {
  const token = serverEnv.GITHUB_TOKEN

  const enriched = await Promise.all(
    registry.map(async (pointer): Promise<EnrichedTemplate | undefined> => {
      const [repo, readme, rawManifest] = await Promise.all([
        fetchRepo(pointer.owner, pointer.repo, token),
        fetchReadme(pointer.owner, pointer.repo, token),
        fetchManifest(pointer.owner, pointer.repo, token),
      ])

      const manifest = rawManifest ? parseManifest(rawManifest) : undefined
      if (!manifest) {
        logger.error(
          "template_manifest_unreadable",
          new Error(`no usable manifest for ${pointer.owner}/${pointer.repo}`),
          { owner: pointer.owner, repo: pointer.repo },
        )
        return undefined
      }

      const merged = mergeManifest(pointer, manifest, {
        name: repo.name,
        description: repo.description,
        license: repo.license?.spdx_id ?? repo.license?.name ?? null,
        topics: repo.topics,
        pushedAt: repo.pushed_at,
        stars: repo.stargazers_count,
        htmlUrl: repo.html_url,
      })

      if (!merged) {
        logger.error(
          "template_manifest_incomplete",
          new Error(`no catalogue row for ${pointer.owner}/${pointer.repo}`),
          { owner: pointer.owner, repo: pointer.repo },
        )
        return undefined
      }

      return { ...merged, readme }
    }),
  )

  return enriched.filter(
    (entry): entry is EnrichedTemplate => entry !== undefined,
  )
}
