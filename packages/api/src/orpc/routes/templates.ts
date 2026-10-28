import { ORPCError } from "@orpc/server"
import { z } from "zod"
import { asc, eq } from "drizzle-orm"
import type { TemplateV1, TemplatesListResponseV1 } from "@workspace/contracts/v1"
import {
  db,
  templateRepositorySnapshots,
  templates,
} from "@workspace/database"
import { base } from "../base.js"
import { logger } from "../../constants/logger.js"

const publicTemplateColumns = {
  slug: templates.slug,
  name: templates.name,
  descriptionOverride: templates.descriptionOverride,
  owner: templates.owner,
  repo: templates.repo,
  category: templates.category,
  labels: templates.labels,
  licenseFallback: templates.licenseFallback,
  imageName: templates.imageName,
  repositoryDescription: templateRepositorySnapshots.repositoryDescription,
  canonicalUrl: templateRepositorySnapshots.canonicalUrl,
  license: templateRepositorySnapshots.license,
  readme: templateRepositorySnapshots.readme,
  repositoryUpdatedAt: templateRepositorySnapshots.repositoryUpdatedAt,
  stars: templateRepositorySnapshots.stars,
}

type PublicTemplateRow = {
  slug: string
  name: string
  descriptionOverride: string | null
  owner: string
  repo: string
  category: string
  labels: string[]
  licenseFallback: string | null
  imageName: string | null
  repositoryDescription: string | null
  canonicalUrl: string
  license: string | null
  readme: string | null
  repositoryUpdatedAt: Date | null
  stars: number | null
}

/**
 * Project the editorial template and its latest GitHub snapshot onto the
 * existing public V1 contract. Editorial values remain authoritative; the
 * snapshot supplies repository details that are not curated in the dashboard.
 */
function toPublicTemplate(row: PublicTemplateRow): TemplateV1 {
  return {
    slug: row.slug,
    name: row.name,
    description: row.descriptionOverride ?? row.repositoryDescription ?? "",
    owner: row.owner,
    repo: row.repo,
    license: row.licenseFallback ?? row.license ?? "",
    category: row.category,
    labels: row.labels,
    ...(row.imageName ? { image: `/${row.imageName}` } : {}),
    cloneUrl: row.canonicalUrl,
    ...(row.readme !== null ? { readme: row.readme } : {}),
    ...(row.repositoryUpdatedAt
      ? { updatedAt: row.repositoryUpdatedAt.toISOString() }
      : {}),
    ...(row.stars !== null ? { stars: row.stars } : {}),
  }
}

/**
 * E2E test guard:
 *
 * Playwright suites can force the failure / empty paths by sending
 * x-vercel-protection-bypass with the configured automation secret and
 * x-e2e-force-fail ("1" for failure, "2" for an empty catalog). It is
 * closed by default and disabled in production.
 */
export const e2eForceFail = (
  requestHeaders: Headers
): TemplatesListResponseV1 | null => {
  if (process.env.NODE_ENV === "production") return null
  const bypass = requestHeaders.get("x-vercel-protection-bypass")
  const expected = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  if (!expected || !bypass || bypass !== expected) return null

  const force = requestHeaders.get("x-e2e-force-fail")
  if (force === "1") {
    throw new ORPCError("TEMPLATES_FETCH_FAILED", { status: 502 })
  }
  if (force === "2") return { templates: [] }
  return null
}

export const list = base
  .errors({
    TEMPLATES_FETCH_FAILED: {
      message: "Failed to load the templates catalog. Try again in a few minutes.",
    },
  })
  .handler(async ({ context }): Promise<TemplatesListResponseV1> => {
    const forced = e2eForceFail(context.headers)
    if (forced !== null) return forced

    try {
      const rows = await db
        .select(publicTemplateColumns)
        .from(templates)
        .innerJoin(
          templateRepositorySnapshots,
          eq(templates.id, templateRepositorySnapshots.templateId)
        )
        .orderBy(asc(templates.sortOrder), asc(templates.slug))

      return { templates: rows.map(toPublicTemplate) }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Database query failed"
      logger.error("templates_catalog_fetch_failed", {
        requestId: context.requestId,
        message,
      })
      throw new ORPCError("TEMPLATES_FETCH_FAILED", {
        status: 503,
        message: "Failed to load the templates catalog.",
      })
    }
  })

/** Resolve a catalog slug without loading its GitHub snapshot payload. */
export const resolve = base
  .input(z.object({ slug: z.string().min(1) }))
  .output(
    z
      .object({
        slug: z.string(),
        owner: z.string(),
        repo: z.string(),
      })
      .nullable()
  )
  .handler(async ({ input }) => {
    const [template] = await db
      .select({
        slug: templates.slug,
        owner: templates.owner,
        repo: templates.repo,
      })
      .from(templates)
      .innerJoin(
        templateRepositorySnapshots,
        eq(templates.id, templateRepositorySnapshots.templateId)
      )
      .where(eq(templates.slug, input.slug))
      .limit(1)

    if (!template) return null
    return template
  })

export const templatesRouter = {
  list,
  resolve,
}
