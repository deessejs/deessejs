import { ORPCError } from "@orpc/server"
import { and, asc, eq, max } from "drizzle-orm"
import { z } from "zod"
import {
  db,
  templateRepositorySnapshots,
  templates,
  user,
} from "@workspace/database"
import type { NewTemplateRow } from "@workspace/database"
import { TEMPLATE_IMAGE_FILENAMES } from "../../templates-images.js"
import { CATEGORY_SLUGS } from "../../templates-labels.js"
import {
  acquireTemplateRepository,
  InvalidTemplateSourceError,
  TemplateSourceFetchError,
} from "../../core/templates/admin.js"
import { adminProcedure } from "../admin-middleware.js"

const adminTemplate = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  descriptionOverride: z.string().nullable(),
  owner: z.string(),
  repo: z.string(),
  category: z.string(),
  labels: z.array(z.string()),
  licenseFallback: z.string().nullable(),
  access: z.enum(["free", "paid"]),
  imageName: z.string().nullable(),
  repositoryName: z.string(),
  canonicalUrl: z.string().url(),
  stars: z.number().int().nonnegative().nullable(),
  fetchedAt: z.string().datetime(),
})

const adminTemplatesList = z.object({ templates: z.array(adminTemplate) })

const createTemplateInput = z.object({
  repositoryUrl: z.string().trim().min(1).max(2048),
  slug: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  descriptionOverride: z.string().trim().max(10000).nullable().optional(),
  category: z.enum(CATEGORY_SLUGS),
  labels: z.array(z.string().trim().min(1).max(64)).max(50),
  licenseFallback: z.string().trim().max(128).nullable().optional(),
  access: z.enum(["free", "paid"]).default("free"),
  imageName: z.enum(TEMPLATE_IMAGE_FILENAMES).nullable().optional(),
})

const createTemplateOutput = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
})

const templateErrors = {
  TEMPLATE_SLUG_CONFLICT: {
    status: 409,
    message: "A template with this slug already exists.",
  },
  TEMPLATE_GITHUB_SOURCE_INVALID: {
    status: 422,
    message: "Use a URL to a public GitHub repository.",
  },
  TEMPLATE_GITHUB_FETCH_FAILED: {
    status: 502,
    message: "GitHub data could not be fetched. Check the URL and try again.",
  },
}

function hasPostgresCode(error: unknown, code: string): boolean {
  let current: unknown = error
  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current !== "object" || current === null) return false
    if ("code" in current && current.code === code) return true
    current = "cause" in current ? current.cause : null
  }
  return false
}

export const list = adminProcedure
  .output(adminTemplatesList)
  .handler(async () => {
    const rows = await db
      .select({
        id: templates.id,
        slug: templates.slug,
        name: templates.name,
        descriptionOverride: templates.descriptionOverride,
        owner: templates.owner,
        repo: templates.repo,
        category: templates.category,
        labels: templates.labels,
        licenseFallback: templates.licenseFallback,
        access: templates.access,
        imageName: templates.imageName,
        repositoryName: templateRepositorySnapshots.repositoryName,
        canonicalUrl: templateRepositorySnapshots.canonicalUrl,
        stars: templateRepositorySnapshots.stars,
        fetchedAt: templateRepositorySnapshots.fetchedAt,
      })
      .from(templates)
      .innerJoin(
        templateRepositorySnapshots,
        eq(templates.id, templateRepositorySnapshots.templateId)
      )
      .orderBy(asc(templates.sortOrder), asc(templates.slug))

    return {
      templates: rows.map((row) => ({
        ...row,
        fetchedAt: row.fetchedAt.toISOString(),
      })),
    }
  })

export const create = adminProcedure
  .errors(templateErrors)
  .input(createTemplateInput)
  .output(createTemplateOutput)
  .handler(async ({ context, input, errors }) => {
    const [existing] = await db
      .select({ id: templates.id })
      .from(templates)
      .where(eq(templates.slug, input.slug))
      .limit(1)

    if (existing) throw errors.TEMPLATE_SLUG_CONFLICT()

    let acquired: Awaited<ReturnType<typeof acquireTemplateRepository>>
    try {
      acquired = await acquireTemplateRepository(input.repositoryUrl)
    } catch (error) {
      if (error instanceof InvalidTemplateSourceError) {
        throw errors.TEMPLATE_GITHUB_SOURCE_INVALID()
      }
      if (error instanceof TemplateSourceFetchError) {
        throw errors.TEMPLATE_GITHUB_FETCH_FAILED()
      }
      throw error
    }

    try {
      return await db.transaction(async (tx) => {
        // Re-read the live role after GitHub acquisition and immediately
        // before the short database transaction writes either row.
        const [actor] = await tx
          .select({ role: user.role })
          .from(user)
          .where(and(eq(user.id, context.user.id), eq(user.role, "admin")))
          .limit(1)

        if (!actor) throw new ORPCError("FORBIDDEN")

        const [duplicate] = await tx
          .select({ id: templates.id })
          .from(templates)
          .where(eq(templates.slug, input.slug))
          .limit(1)
        if (duplicate) throw errors.TEMPLATE_SLUG_CONFLICT()

        const [order] = await tx
          .select({ maximum: max(templates.sortOrder) })
          .from(templates)
        const sortOrder = (order?.maximum ?? -1) + 1

        const values: NewTemplateRow = {
          slug: input.slug,
          name: input.name,
          descriptionOverride: input.descriptionOverride || null,
          owner: acquired.owner,
          repo: acquired.repo,
          category: input.category,
          labels: input.labels,
          licenseFallback: input.licenseFallback || null,
          access: input.access,
          imageName: input.imageName ?? null,
          sortOrder,
        }

        const [template] = await tx
          .insert(templates)
          .values(values)
          .returning({
            id: templates.id,
            slug: templates.slug,
            name: templates.name,
          })

        if (!template) throw new Error("Template insert returned no row.")

        await tx.insert(templateRepositorySnapshots).values({
          templateId: template.id,
          ...acquired.snapshot,
        })

        return template
      })
    } catch (error) {
      if (hasPostgresCode(error, "23505")) {
        throw errors.TEMPLATE_SLUG_CONFLICT()
      }
      throw error
    }
  })

export const adminTemplatesRouter = { list, create }
