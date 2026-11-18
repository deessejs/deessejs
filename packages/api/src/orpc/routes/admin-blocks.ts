import { and, asc, eq } from "drizzle-orm"
import { ORPCError } from "@orpc/server"
import { z } from "zod"
import { db, blockPublications, user } from "@workspace/database"
import {
  createGitHubTemplateSourceAdapter,
  parseBlockDescriptor,
} from "@workspace/registry"
import { parseGitHubRepositoryUrl } from "../../core/templates/admin.js"
import { adminProcedure } from "../admin-middleware.js"

const cleanDirectory = (value: string) =>
  value.split("/").filter(Boolean).join("/")
const descriptorPath = (value: string) =>
  [cleanDirectory(value), "deesse-block.json"].filter(Boolean).join("/")

export const listOfficial = adminProcedure.handler(async () => {
  const rows = await db
    .select()
    .from(blockPublications)
    .where(
      and(
        eq(blockPublications.ownerType, "platform"),
        eq(blockPublications.publicationState, "current"),
        eq(blockPublications.reviewStatus, "approved")
      )
    )
    .orderBy(asc(blockPublications.category), asc(blockPublications.name))
  return {
    blocks: rows.map((row) => ({
      ...row,
      descriptor: JSON.parse(row.descriptor),
      submittedAt: row.submittedAt.toISOString(),
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
    })),
  }
})

export const createOfficial = adminProcedure
  .input(
    z.object({
      slug: z.string().trim().min(1).max(100),
      name: z.string().trim().min(1).max(200),
      description: z.string().trim().max(10000).default(""),
      category: z.string().trim().min(1).max(64),
      repositoryUrl: z.string().url().max(2048),
      subdirectory: z.string().trim().default(""),
    })
  )
  .handler(async ({ input, context }) => {
    const repository = parseGitHubRepositoryUrl(input.repositoryUrl)
    if (!repository) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Use a URL for a public GitHub repository.",
      })
    }
    const repositoryUrl = `${repository.owner}/${repository.repo}`
    const source = createGitHubTemplateSourceAdapter()
    const revision = await source.resolveRevision(repositoryUrl, "HEAD")
    const snapshot = await source.resolve({
      repository: repositoryUrl,
      ref: revision,
    })
    let descriptorValue: unknown
    try {
      descriptorValue = JSON.parse(
        new TextDecoder().decode(
          await snapshot.readFile(descriptorPath(input.subdirectory))
        )
      )
    } catch {
      throw new ORPCError("BAD_REQUEST", {
        message: "The repository must contain a valid deesse-block.json.",
      })
    }
    const parsed = parseBlockDescriptor(descriptorValue)
    if (!parsed.success) {
      throw new ORPCError("BAD_REQUEST", {
        message: parsed.diagnostics.map((item) => item.message).join(" "),
      })
    }

    return db.transaction(async (tx) => {
      const [actor] = await tx
        .select({ id: user.id })
        .from(user)
        .where(and(eq(user.id, context.user.id), eq(user.role, "admin")))
        .limit(1)
      if (!actor) throw new ORPCError("FORBIDDEN")

      const [existing] = await tx
        .select({ id: blockPublications.id })
        .from(blockPublications)
        .where(
          and(
            eq(blockPublications.ownerType, "platform"),
            eq(blockPublications.slug, input.slug)
          )
        )
        .limit(1)
      if (existing) {
        throw new ORPCError("CONFLICT", {
          message: "An official block with this slug already exists.",
        })
      }

      const [row] = await tx
        .insert(blockPublications)
        .values({
          ownerType: "platform",
          organizationId: null,
          organizationSlug: null,
          submittedBy: actor.id,
          reviewedBy: actor.id,
          reviewedAt: new Date(),
          reviewReason: null,
          slug: input.slug,
          name: input.name,
          description: input.description,
          category: input.category,
          repositoryUrl,
          subdirectory: cleanDirectory(input.subdirectory),
          sourceCommit: snapshot.revision,
          descriptor: JSON.stringify(parsed.data),
          reviewStatus: "approved",
          publicationState: "current",
        })
        .returning({
          id: blockPublications.id,
          slug: blockPublications.slug,
          name: blockPublications.name,
          sourceCommit: blockPublications.sourceCommit,
        })
      return row
    })
  })

export const adminBlocksRouter = { listOfficial, createOfficial }
