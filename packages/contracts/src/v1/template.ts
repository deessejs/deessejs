import { z } from "zod"

/**
 * TemplateV1 — single source of truth for the templates registry payload.
 *
 * Consumed by the API detail procedures, CLI info/init commands, and web
 * template detail pages.
 *
 * This is the full public detail shape. Catalog list procedures use the
 * compact `TemplateSummaryV1` projection.
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
 * oRPC procedures that attach this schema as an output contract also validate
 * their responses at runtime. Procedures that only annotate their handler
 * return type rely on compile-time checking instead.
 */
export const TemplateV1 = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  owner: z.string().min(1).nullable().optional(),
  repo: z.string().min(1).nullable().optional(),
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
   * `/repos/{owner}/{repo}/readme` endpoint and returned by targeted detail
   * procedures when available. Catalog list responses omit this field.
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
  /** API-authoritative marker for templates that must resolve through managed releases. */
  requiresManaged: z.boolean().optional(),
  sourceType: z.enum(["github", "managed"]).optional(),
  installable: z.boolean().optional(),
})

export type TemplateV1 = z.infer<typeof TemplateV1>
