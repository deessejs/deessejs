import { and, asc, eq } from "drizzle-orm"
import { ORPCError } from "@orpc/server"
import { z } from "zod"
import { db, blockPublications } from "@workspace/database"
import { adminProcedure } from "../admin-middleware.js"

export const list = adminProcedure.handler(async () => {
  const rows = await db
    .select()
    .from(blockPublications)
    .where(eq(blockPublications.reviewStatus, "pending"))
    .orderBy(asc(blockPublications.submittedAt))
  return {
    submissions: rows.map((row) => ({
      ...row,
      descriptor: JSON.parse(row.descriptor),
      submittedAt: row.submittedAt.toISOString(),
      reviewedAt: null,
    })),
  }
})

const decision = z.object({
  publicationId: z.string().uuid(),
  reason: z.string().trim().min(1).max(1000).nullable().optional(),
})
export const approve = adminProcedure
  .input(decision)
  .handler(async ({ input, context }) =>
    db.transaction(async (tx) => {
      const [pending] = await tx
        .select()
        .from(blockPublications)
        .where(
          and(
            eq(blockPublications.id, input.publicationId),
            eq(blockPublications.reviewStatus, "pending")
          )
        )
        .for("update")
      if (!pending)
        throw new ORPCError("CONFLICT", {
          message: "Submission is no longer pending.",
        })
      if (pending.ownerType !== "organization" || !pending.organizationSlug) {
        throw new ORPCError("CONFLICT", {
          message: "Only organization submissions can be reviewed here.",
        })
      }
      await tx
        .update(blockPublications)
        .set({ publicationState: "superseded" })
        .where(
          and(
            eq(blockPublications.organizationSlug, pending.organizationSlug),
            eq(blockPublications.slug, pending.slug),
            eq(blockPublications.publicationState, "current")
          )
        )
      const [row] = await tx
        .update(blockPublications)
        .set({
          reviewStatus: "approved",
          publicationState: "current",
          reviewedBy: context.user.id,
          reviewedAt: new Date(),
          reviewReason: input.reason ?? null,
        })
        .where(eq(blockPublications.id, pending.id))
        .returning({ id: blockPublications.id })
      return row
    })
  )

export const reject = adminProcedure
  .input(decision)
  .handler(async ({ input, context }) => {
    if (!input.reason)
      throw new ORPCError("BAD_REQUEST", {
        message: "A rejection reason is required.",
      })
    const [row] = await db
      .update(blockPublications)
      .set({
        reviewStatus: "rejected",
        reviewedBy: context.user.id,
        reviewedAt: new Date(),
        reviewReason: input.reason,
      })
      .where(
        and(
          eq(blockPublications.id, input.publicationId),
          eq(blockPublications.reviewStatus, "pending")
        )
      )
      .returning({ id: blockPublications.id })
    if (!row)
      throw new ORPCError("CONFLICT", {
        message: "Submission is no longer pending.",
      })
    return row
  })
export const adminBlockPublicationsRouter = { list, approve, reject }
