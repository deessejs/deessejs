import { z } from "zod"

/**
 * TemplateV1 — single source of truth for the templates registry payload.
 *
 * Consumed by:
 *   - packages/api  (server, builds the response from the hand-curated list)
 *   - apps/cli      (types what it reads from `/api/v1/templates`)
 *   - apps/web      (renders /templates and /templates/[template_slug])
 *
 * Wire format is the JSON shape returned by GET /api/v1/templates.
 *
 * These schemas use the default Zod object mode, which strips unknown keys
 * instead of rejecting them. A client that validates a response against
 * them therefore keeps working when a new field appears, whether that field
 * is optional or required.
 *
 * What breaks a client is a change to a field it already knows: removing or
 * renaming one, changing its type, narrowing the set of accepted values, or
 * adding a constraint the existing values do not satisfy. That reasoning
 * depends on the mode of the schema: switching to `.strict()` rejects the
 * unknown keys the default mode strips, and would make every new field
 * breaking for the clients that validate with it.
 *
 * Note the current state of the enforcement: the oRPC procedure types its
 * response with this schema rather than attaching it as a runtime output
 * schema, so the guarantee today is a compile-time one on both sides.
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
