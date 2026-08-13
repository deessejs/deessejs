import { z } from "zod"

/**
 * TemplateV1 — single source of truth for the templates registry payload.
 *
 * Consumed by:
 *   - packages/api  (server, builds the response from the hand-curated list)
 *   - apps/cli      (validates `/api/v1/templates` responses)
 *   - apps/web      (renders /templates and /templates/[template_slug])
 *
 * Wire format is the JSON shape returned by GET /api/v1/templates. Adding a
 * required field here is a breaking change for any installed CLI V1 client
 * that has not been updated to read the new version. The CLI's `parse()`
 * call will throw on the new shape, surfacing as a `parse_error` to the user.
 *
 * Optional fields (e.g. `image`, `cloneUrl`) keep the response shape backward
 * compatible: existing clients that don't know about them continue to parse
 * the response without change.
 */
export const TemplateV1 = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  owner: z.string().min(1),
  repo: z.string().min(1),
  license: z.string(),
  category: z.string().min(1),
  labels: z.array(z.string()),
  image: z.string().optional(),
  /**
   * Optional override for the clone URL. Falls back to
   * `https://github.com/<owner>/<repo>` when absent.
   */
  cloneUrl: z.string().optional(),
  /**
   * Optional raw README markdown for the template. Sourced from GitHub's
   * `/repos/{owner}/{repo}/readme` endpoint. Clients that do not know
   * about this field (older CLI versions) continue to parse the response
   * without change.
   */
  readme: z.string().optional(),
  /**
   * Optional ISO-8601 timestamp of the last push to the default branch.
   * Sourced from GitHub's `/repos/{owner}/{repo}` response (`pushed_at`).
   * Lets the UI display a freshness indicator without an extra round-trip.
   */
  updatedAt: z.string().optional(),
  /**
   * Optional star count. Sourced from GitHub's `/repos/{owner}/{repo}`
   * response (`stargazers_count`). Rendered on the marketing cards as
   * a soft signal of activity. Not used for ranking.
   */
  stars: z.number().int().nonnegative().optional(),
})

export type TemplateV1 = z.infer<typeof TemplateV1>
