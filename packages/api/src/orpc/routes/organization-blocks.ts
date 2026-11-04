import { and, desc, eq } from "drizzle-orm"
import { ORPCError } from "@orpc/server"
import { z } from "zod"
import {
  parseBlockDescriptor,
  createGitHubTemplateSourceAdapter,
} from "@workspace/registry"
import { db, blockPublications } from "@workspace/database"
import { hasManagingRole } from "@workspace/auth/organization/roles"
import { parseGitHubRepositoryUrl } from "../../core/templates/admin.js"
import { findOrganizationForMember } from "../../core/organization/membership.js"
import { authGuard } from "../auth-middleware.js"
import { base } from "../base.js"

const orgInput = z.object({ organizationSlug: z.string().min(1) })
const resolve = async (userId: string, slug: string) => {
  const org = await findOrganizationForMember(userId, slug)
  if (!org) throw new ORPCError("FORBIDDEN")
  return org
}
const cleanDirectory = (value: string) =>
  value.split("/").filter(Boolean).join("/")
const descriptorPath = (value: string) =>
  [cleanDirectory(value), "deesse-block.json"].filter(Boolean).join("/")
const manageableOrg = async (userId: string, slug: string) => {
  const org = await resolve(userId, slug)
  if (!hasManagingRole(org.role)) throw new ORPCError("FORBIDDEN")
  return org
}

export const list = base
  .input(orgInput)
  .use(authGuard)
  .handler(async ({ input, context }) => {
    const org = await resolve(context.user.id, input.organizationSlug)
    const rows = await db
      .select()
      .from(blockPublications)
      .where(eq(blockPublications.organizationId, org.id))
      .orderBy(desc(blockPublications.submittedAt))
    return {
      blocks: rows.map((row) => ({
        ...row,
        descriptor: JSON.parse(row.descriptor),
        submittedAt: row.submittedAt.toISOString(),
        reviewedAt: row.reviewedAt?.toISOString() ?? null,
      })),
    }
  })

export const create = base
  .input(
    z.object({
      ...orgInput.shape,
      slug: z.string().trim().min(1).max(100),
      name: z.string().trim().min(1).max(200),
      description: z.string().max(10000).default(""),
      category: z.string().trim().min(1).max(64),
      repositoryUrl: z.string().url(),
      subdirectory: z.string().default(""),
    })
  )
  .use(authGuard)
  .handler(async ({ input, context }) => {
    const org = await resolve(context.user.id, input.organizationSlug)
    if (!hasManagingRole(org.role)) throw new ORPCError("FORBIDDEN")
    const repository = parseGitHubRepositoryUrl(input.repositoryUrl)
    if (!repository)
      throw new ORPCError("BAD_REQUEST", {
        message: "Use a GitHub repository URL.",
      })
    const repositoryUrl = `${repository.owner}/${repository.repo}`
    const source = createGitHubTemplateSourceAdapter()
    const revision = await source.resolveRevision(repositoryUrl, "HEAD")
    const snapshot = await source.resolve({
      repository: repositoryUrl,
      ref: revision,
    })
    const path = descriptorPath(input.subdirectory)
    const bytes = await snapshot.readFile(path)
    let raw: unknown
    try {
      raw = JSON.parse(new TextDecoder().decode(bytes))
    } catch {
      throw new ORPCError("BAD_REQUEST", {
        message: "deesse-block.json must contain valid JSON.",
      })
    }
    const result = parseBlockDescriptor(raw)
    if (!result.success)
      throw new ORPCError("BAD_REQUEST", {
        message: result.diagnostics.map((d) => d.message).join(" "),
      })
    const [row] = await db
      .insert(blockPublications)
      .values({
        organizationId: org.id,
        organizationSlug: org.slug,
        submittedBy: context.user.id,
        slug: input.slug,
        name: input.name,
        description: input.description,
        category: input.category,
        repositoryUrl,
        subdirectory: input.subdirectory,
        sourceCommit: snapshot.revision,
        descriptor: JSON.stringify(result.data),
        reviewStatus: "draft",
        publicationState: "private",
      })
      .returning({
        id: blockPublications.id,
        sourceCommit: blockPublications.sourceCommit,
      })
    return row
  })

export const submit = base
  .input(
    z.object({
      ...orgInput.shape,
      blockId: z.string().uuid(),
      ref: z.string().min(1).default("HEAD"),
    })
  )
  .use(authGuard)
  .handler(async ({ input, context }) => {
    const org = await manageableOrg(context.user.id, input.organizationSlug)
    const [previous] = await db
      .select()
      .from(blockPublications)
      .where(
        and(
          eq(blockPublications.id, input.blockId),
          eq(blockPublications.organizationId, org.id)
        )
      )
    if (!previous) throw new ORPCError("NOT_FOUND")
    const source = createGitHubTemplateSourceAdapter()
    const revision = await source.resolveRevision(
      previous.repositoryUrl,
      input.ref
    )
    const snapshot = await source.resolve({
      repository: previous.repositoryUrl,
      ref: revision,
    })
    const path = descriptorPath(previous.subdirectory)
    const result = parseBlockDescriptor(
      JSON.parse(new TextDecoder().decode(await snapshot.readFile(path)))
    )
    if (!result.success)
      throw new ORPCError("BAD_REQUEST", {
        message: result.diagnostics.map((d) => d.message).join(" "),
      })
    const [row] = await db
      .insert(blockPublications)
      .values({
        organizationId: org.id,
        organizationSlug: org.slug,
        submittedBy: context.user.id,
        slug: previous.slug,
        name: previous.name,
        description: previous.description,
        category: previous.category,
        repositoryUrl: previous.repositoryUrl,
        subdirectory: previous.subdirectory,
        sourceCommit: snapshot.revision,
        descriptor: JSON.stringify(result.data),
        reviewStatus: "pending",
        publicationState: "private",
      })
      .returning({
        id: blockPublications.id,
        sourceCommit: blockPublications.sourceCommit,
      })
    return row
  })

export const organizationBlocksRouter = { list, create, submit }
