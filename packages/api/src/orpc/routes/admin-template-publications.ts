import { ORPCError } from "@orpc/server"
import { and, asc, eq } from "drizzle-orm"
import { z } from "zod"
import { db, templatePublications, user } from "@workspace/database"
import { adminProcedure } from "../admin-middleware.js"

const publicationSummary = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
  organizationName: z.string(),
  organizationSlug: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  owner: z.string(),
  repo: z.string(),
  category: z.string(),
  labels: z.array(z.string()),
  license: z.string(),
  canonicalUrl: z.string().url(),
  sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
  submittedAt: z.string().datetime(),
  distributionRightsConfirmed: z.boolean(),
  stars: z.number().int().nonnegative().nullable(),
  repositoryName: z.string(),
})

const listOutput = z.object({ submissions: z.array(publicationSummary) })

const decisionErrors = {
  TEMPLATE_SUBMISSION_NOT_PENDING: {
    status: 409,
    message: "This publication request has already been reviewed.",
  },
  TEMPLATE_PUBLICATION_CONFLICT: {
    status: 409,
    message:
      "Another publication for this address is already current. Refresh and review the latest request.",
  },
}

export const list = adminProcedure.output(listOutput).handler(async () => {
  const rows = await db
    .select({
      id: templatePublications.id,
      templateId: templatePublications.templateId,
      organizationName: templatePublications.organizationName,
      organizationSlug: templatePublications.organizationSlug,
      slug: templatePublications.slug,
      name: templatePublications.name,
      description: templatePublications.description,
      owner: templatePublications.owner,
      repo: templatePublications.repo,
      category: templatePublications.category,
      labels: templatePublications.labels,
      license: templatePublications.license,
      canonicalUrl: templatePublications.canonicalUrl,
      sourceCommit: templatePublications.sourceCommit,
      submittedAt: templatePublications.submittedAt,
      distributionRightsConfirmed:
        templatePublications.distributionRightsConfirmed,
      stars: templatePublications.stars,
      repositoryName: templatePublications.repositoryName,
    })
    .from(templatePublications)
    .where(eq(templatePublications.reviewStatus, "pending"))
    .orderBy(asc(templatePublications.submittedAt))

  return {
    submissions: rows.map((row) => ({
      ...row,
      submittedAt: row.submittedAt.toISOString(),
    })),
  }
})

export const approve = adminProcedure
  .input(
    z.object({
      publicationId: z.string().uuid(),
      note: z.string().trim().max(1000).nullable().optional(),
    })
  )
  .errors(decisionErrors)
  .output(
    z.object({
      id: z.string().uuid(),
      publicationState: z.literal("current"),
    })
  )
  .handler(async ({ context, input, errors }) => {
    try {
      const approved = await db.transaction(async (tx) => {
        const [actor] = await tx
          .select({ id: user.id })
          .from(user)
          .where(and(eq(user.id, context.user.id), eq(user.role, "admin")))
          .limit(1)
        if (!actor) throw new ORPCError("FORBIDDEN")

        const [pending] = await tx
          .select({ templateId: templatePublications.templateId })
          .from(templatePublications)
          .where(
            and(
              eq(templatePublications.id, input.publicationId),
              eq(templatePublications.reviewStatus, "pending")
            )
          )
          .limit(1)
        if (!pending) throw errors.TEMPLATE_SUBMISSION_NOT_PENDING()

        await tx
          .update(templatePublications)
          .set({ publicationState: "superseded" })
          .where(
            and(
              eq(templatePublications.templateId, pending.templateId),
              eq(templatePublications.publicationState, "current")
            )
          )

        const [approved] = await tx
          .update(templatePublications)
          .set({
            reviewStatus: "approved",
            publicationState: "current",
            reviewedBy: context.user.id,
            reviewedAt: new Date(),
            reviewReason: input.note?.trim() || null,
          })
          .where(
            and(
              eq(templatePublications.id, input.publicationId),
              eq(templatePublications.reviewStatus, "pending")
            )
          )
          .returning({
            id: templatePublications.id,
            publicationState: templatePublications.publicationState,
          })

        if (!approved) throw errors.TEMPLATE_SUBMISSION_NOT_PENDING()
        return approved
      })
      return { id: approved.id, publicationState: "current" as const }
    } catch (error) {
      if (isPostgresUniqueViolation(error)) {
        throw errors.TEMPLATE_PUBLICATION_CONFLICT()
      }
      throw error
    }
  })

export const reject = adminProcedure
  .input(
    z.object({
      publicationId: z.string().uuid(),
      reason: z.string().trim().min(1).max(1000),
    })
  )
  .errors(decisionErrors)
  .output(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, input, errors }) => {
    return db.transaction(async (tx) => {
      const [actor] = await tx
        .select({ id: user.id })
        .from(user)
        .where(and(eq(user.id, context.user.id), eq(user.role, "admin")))
        .limit(1)
      if (!actor) throw new ORPCError("FORBIDDEN")

      const [rejected] = await tx
        .update(templatePublications)
        .set({
          reviewStatus: "rejected",
          reviewedBy: context.user.id,
          reviewedAt: new Date(),
          reviewReason: input.reason,
        })
        .where(
          and(
            eq(templatePublications.id, input.publicationId),
            eq(templatePublications.reviewStatus, "pending")
          )
        )
        .returning({ id: templatePublications.id })

      if (!rejected) throw errors.TEMPLATE_SUBMISSION_NOT_PENDING()
      return rejected
    })
  })

function isPostgresUniqueViolation(error: unknown): boolean {
  let current: unknown = error
  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current !== "object" || current === null) return false
    if ("code" in current && current.code === "23505") return true
    current = "cause" in current ? current.cause : null
  }
  return false
}

export const adminTemplatePublicationsRouter = { list, approve, reject }
