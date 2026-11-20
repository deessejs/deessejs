import { and, asc, eq, or } from "drizzle-orm"
import { z } from "zod"
import { db, blockPublications } from "@workspace/database"
import { base } from "../base.js"
import { callerHasActiveOrganizationPro } from "../../core/organization/entitlement.js"

const projection = {
  id: blockPublications.id,
  ownerType: blockPublications.ownerType,
  organizationSlug: blockPublications.organizationSlug,
  slug: blockPublications.slug,
  name: blockPublications.name,
  description: blockPublications.description,
  category: blockPublications.category,
  repositoryUrl: blockPublications.repositoryUrl,
  subdirectory: blockPublications.subdirectory,
  sourceCommit: blockPublications.sourceCommit,
  descriptor: blockPublications.descriptor,
}
export const list = base.handler(async ({ context }) => {
  const hasPro = await callerHasActiveOrganizationPro(context)
  const rows = await db
    .select(projection)
    .from(blockPublications)
    .where(
      and(
        eq(blockPublications.reviewStatus, "approved"),
        eq(blockPublications.publicationState, "current"),
        ...(hasPro
          ? []
          : [
              or(
                eq(blockPublications.ownerType, "organization"),
                eq(blockPublications.access, "free")
              ),
            ])
      )
    )
    .orderBy(asc(blockPublications.category), asc(blockPublications.name))
  return {
    blocks: rows.map((row) => ({
      ...row,
      descriptor: JSON.parse(row.descriptor),
    })),
  }
})
export const resolve = base
  .input(
    z.object({ organizationSlug: z.string().min(1), slug: z.string().min(1) })
  )
  .handler(async ({ input, context }) => {
    const hasPro = await callerHasActiveOrganizationPro(context)
    const ownerFilter =
      input.organizationSlug === "official"
        ? eq(blockPublications.ownerType, "platform")
        : and(
            eq(blockPublications.ownerType, "organization"),
            eq(blockPublications.organizationSlug, input.organizationSlug)
          )
    const [row] = await db
      .select(projection)
      .from(blockPublications)
      .where(
        and(
          ownerFilter,
          eq(blockPublications.slug, input.slug),
          eq(blockPublications.reviewStatus, "approved"),
          eq(blockPublications.publicationState, "current"),
          ...(hasPro || input.organizationSlug !== "official"
            ? []
            : [eq(blockPublications.access, "free")])
        )
      )
      .limit(1)
    return row
      ? {
          block: {
            ...row,
            descriptor: JSON.parse(row.descriptor),
          },
        }
      : { block: null }
  })
export const blocksRouter = { list, resolve }
