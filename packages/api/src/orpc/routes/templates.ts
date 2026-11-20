import { ORPCError } from "@orpc/server"
import { z } from "zod"
import { and, asc, eq } from "drizzle-orm"
import {
  CommunityTemplateV1,
  CommunityTemplatesListResponseV1,
  TemplateV1,
  TemplatesListResponseV1,
} from "@workspace/contracts/v1"
import {
  db,
  templatePublications,
  templateRepositorySnapshots,
  templates,
} from "@workspace/database"
import { base } from "../base.js"
import { logger } from "../../constants/logger.js"
import { serverEnv } from "@workspace/env/server"
import { API_BASE_PATH } from "../../constants/base-path.js"
import { callerHasActiveOrganizationPro } from "../../core/organization/entitlement.js"

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
  imageObjectId: templates.imageObjectId,
  repositoryDescription: templateRepositorySnapshots.repositoryDescription,
  canonicalUrl: templateRepositorySnapshots.canonicalUrl,
  license: templateRepositorySnapshots.license,
  repositoryUpdatedAt: templateRepositorySnapshots.repositoryUpdatedAt,
  stars: templateRepositorySnapshots.stars,
}

const publicTemplateDetailColumns = {
  ...publicTemplateColumns,
  readme: templateRepositorySnapshots.readme,
}

const communityListColumns = {
  organizationSlug: templatePublications.organizationSlug,
  organizationName: templatePublications.organizationName,
  slug: templatePublications.slug,
  name: templatePublications.name,
  description: templatePublications.description,
  owner: templatePublications.owner,
  repo: templatePublications.repo,
  license: templatePublications.license,
  category: templatePublications.category,
  labels: templatePublications.labels,
  imageName: templatePublications.imageName,
  imageObjectId: templatePublications.imageObjectId,
  canonicalUrl: templatePublications.canonicalUrl,
  repositoryUpdatedAt: templatePublications.repositoryUpdatedAt,
  stars: templatePublications.stars,
  sourceCommit: templatePublications.sourceCommit,
}

const communityDetailColumns = {
  ...communityListColumns,
  readme: templatePublications.readme,
}

const publicCommunity = and(
  eq(templatePublications.reviewStatus, "approved"),
  eq(templatePublications.publicationState, "current")
)

function toCommunityTemplate(row: {
  organizationSlug: string
  organizationName: string
  slug: string
  name: string
  description: string
  owner: string
  repo: string
  license: string
  category: string
  labels: string[]
  imageName: string | null
  imageObjectId: string | null
  canonicalUrl: string
  repositoryUpdatedAt: Date | null
  stars: number | null
  sourceCommit: string
  readme?: string | null
}): CommunityTemplateV1 {
  return {
    slug: `@${row.organizationSlug}/${row.slug}`,
    name: row.name,
    description: row.description,
    owner: row.owner,
    repo: row.repo,
    license: row.license,
    category: row.category,
    labels: row.labels,
    ...(row.imageObjectId
      ? {
          image: `${serverEnv.API_BASE_URL}${API_BASE_PATH}/images/${row.imageObjectId}`,
        }
      : row.imageName
        ? { image: `/${row.imageName}` }
        : {}),
    cloneUrl: row.canonicalUrl,
    ...(row.readme != null ? { readme: row.readme } : {}),
    ...(row.repositoryUpdatedAt
      ? { updatedAt: row.repositoryUpdatedAt.toISOString() }
      : {}),
    ...(row.stars !== null ? { stars: row.stars } : {}),
    community: true,
    organizationSlug: row.organizationSlug,
    organizationName: row.organizationName,
    templateSlug: row.slug,
    sourceCommit: row.sourceCommit,
  }
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
  imageObjectId: string | null
  repositoryDescription: string | null
  canonicalUrl: string
  license: string | null
  readme?: string | null
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
    ...(row.imageObjectId
      ? {
          image: `${serverEnv.API_BASE_URL}${API_BASE_PATH}/images/${row.imageObjectId}`,
        }
      : row.imageName
        ? { image: `/${row.imageName}` }
        : {}),
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
      message:
        "Failed to load the templates catalog. Try again in a few minutes.",
    },
  })
  .output(TemplatesListResponseV1)
  .handler(async ({ context }): Promise<TemplatesListResponseV1> => {
    const forced = e2eForceFail(context.headers)
    if (forced !== null) return forced

    try {
      const hasPro = await callerHasActiveOrganizationPro(context)
      const rows = await db
        .select(publicTemplateColumns)
        .from(templates)
        .innerJoin(
          templateRepositorySnapshots,
          eq(templates.id, templateRepositorySnapshots.templateId)
        )
        .where(
          hasPro
            ? eq(templates.ownerType, "platform")
            : and(
                eq(templates.ownerType, "platform"),
                eq(templates.access, "free")
              )
        )
        .orderBy(asc(templates.sortOrder), asc(templates.slug))

      return {
        templates: rows.map((row) =>
          toPublicTemplate({ ...row, readme: null })
        ),
      }
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

export const detail = base
  .input(z.object({ slug: z.string().min(1) }))
  .output(TemplateV1.nullable())
  .handler(async ({ input, context }): Promise<TemplateV1 | null> => {
    const hasPro = await callerHasActiveOrganizationPro(context)
    const [row] = await db
      .select(publicTemplateDetailColumns)
      .from(templates)
      .innerJoin(
        templateRepositorySnapshots,
        eq(templates.id, templateRepositorySnapshots.templateId)
      )
      .where(
        and(
          eq(templates.slug, input.slug),
          eq(templates.ownerType, "platform"),
          ...(hasPro ? [] : [eq(templates.access, "free")])
        )
      )
      .limit(1)
    return row ? toPublicTemplate(row as PublicTemplateRow) : null
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
  .handler(async ({ input, context }) => {
    const hasPro = await callerHasActiveOrganizationPro(context)
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
      .where(
        and(
          eq(templates.slug, input.slug),
          eq(templates.ownerType, "platform"),
          ...(hasPro ? [] : [eq(templates.access, "free")])
        )
      )
      .limit(1)

    if (!template) return null
    return { slug: template.slug, owner: template.owner, repo: template.repo }
  })

const community = {
  list: base
    .output(CommunityTemplatesListResponseV1)
    .handler(async (): Promise<CommunityTemplatesListResponseV1> => {
      const rows = await db
        .select(communityListColumns)
        .from(templatePublications)
        .where(and(publicCommunity))
        .orderBy(
          asc(templatePublications.organizationName),
          asc(templatePublications.name),
          asc(templatePublications.slug)
        )

      return {
        templates: rows.map((row) => toCommunityTemplate(row)),
      }
    }),

  detail: base
    .input(
      z.object({
        organizationSlug: z.string().min(1),
        templateSlug: z.string().min(1),
      })
    )
    .output(CommunityTemplateV1.nullable())
    .handler(async ({ input }): Promise<CommunityTemplateV1 | null> => {
      const [row] = await db
        .select(communityDetailColumns)
        .from(templatePublications)
        .where(
          and(
            publicCommunity,
            eq(templatePublications.organizationSlug, input.organizationSlug),
            eq(templatePublications.slug, input.templateSlug)
          )
        )
        .limit(1)
      return row ? toCommunityTemplate(row) : null
    }),

  resolve: base
    .input(z.object({ address: z.string().min(1).max(202) }))
    .output(
      z
        .object({
          slug: z.string(),
          owner: z.string(),
          repo: z.string(),
          sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
          community: z.literal(true),
        })
        .nullable()
    )
    .handler(async ({ input }) => {
      const match =
        /^@([a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?)\/([a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?)$/.exec(
          input.address
        )
      const organizationSlug = match?.[1]
      const templateSlug = match?.[2]
      if (!organizationSlug || !templateSlug) return null

      const [publication] = await db
        .select({
          owner: templatePublications.owner,
          repo: templatePublications.repo,
          sourceCommit: templatePublications.sourceCommit,
        })
        .from(templatePublications)
        .where(
          and(
            eq(templatePublications.organizationSlug, organizationSlug),
            eq(templatePublications.slug, templateSlug),
            eq(templatePublications.reviewStatus, "approved"),
            eq(templatePublications.publicationState, "current")
          )
        )
        .limit(1)

      if (!publication) return null
      return {
        slug: input.address,
        ...publication,
        community: true as const,
      }
    }),
}

export const templatesRouter = {
  list,
  detail,
  resolve,
  community,
}
