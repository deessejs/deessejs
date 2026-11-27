import { createHash, randomUUID } from "node:crypto"
import { Readable } from "node:stream"
import { and, desc, eq, or } from "drizzle-orm"
import { ORPCError } from "@orpc/server"
import { z } from "zod"
import {
  db, blockPublications, managedReleaseUploads, managedReleases, member, organization, templates, user,
} from "@workspace/database"
import { hasManagingRole } from "@workspace/auth/organization/roles"
import { hasOrganizationProEntitlement } from "@workspace/auth/organization/entitlement"
import { callerHasActiveOrganizationPro } from "../../core/organization/entitlement.js"
import { inspectManagedReleaseArchive, MAX_MANAGED_ARCHIVE_BYTES } from "@workspace/registry/v1"
import { authGuard } from "../auth-middleware.js"
import { adminProcedure } from "../admin-middleware.js"
import { base } from "../base.js"
import { getManagedReleaseStorage } from "../../core/managed-releases/storage.js"
import { cleanupExpiredManagedReleaseUploads } from "../../core/managed-releases/lifecycle.js"

const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/
function compareVersion(left: string, right: string): number {
  const a = left.split(".").map(BigInt)
  const b = right.split(".").map(BigInt)
  for (let index = 0; index < 3; index += 1) {
    if ((a[index] ?? 0) !== (b[index] ?? 0)) return (a[index] ?? 0) < (b[index] ?? 0) ? -1 : 1
  }
  return 0
}
function sha(bytes: Uint8Array): string { return createHash("sha256").update(bytes).digest("hex") }
async function readBody(body: Readable | undefined, maximum: number): Promise<Uint8Array> {
  if (!body) throw new Error("The uploaded archive is missing.")
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of body) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array)
    size += bytes.byteLength
    if (size > maximum) throw new Error("The uploaded archive exceeds the limit.")
    chunks.push(bytes)
  }
  return new Uint8Array(Buffer.concat(chunks))
}

type Target = { kind: "template" | "block"; targetId: string; destination: string }
async function findTarget(kind: "template" | "block", slug: string, destination: string) {
  if (kind === "template") {
    const [row] = destination === "deessejs"
      ? await db.select({ id: templates.id, organizationId: templates.organizationId }).from(templates).where(and(eq(templates.slug, slug), eq(templates.ownerType, "platform"))).limit(1)
      : await db.select({ id: templates.id, organizationId: templates.organizationId }).from(templates).innerJoin(organization, eq(organization.id, templates.organizationId)).where(and(eq(templates.slug, slug), eq(templates.ownerType, "organization"), eq(organization.slug, destination))).limit(1)
    if (!row) throw new ORPCError("NOT_FOUND")
    return row.id
  }
  if (destination === "deessejs") {
    const [row] = await db.select({ id: blockPublications.id }).from(blockPublications).where(and(eq(blockPublications.slug, slug), eq(blockPublications.ownerType, "platform"), eq(blockPublications.publicationState, "current"), eq(blockPublications.reviewStatus, "approved"))).limit(1)
    if (!row) throw new ORPCError("NOT_FOUND")
    return row.id
  }
  const [row] = await db.select({ id: blockPublications.id }).from(blockPublications).innerJoin(organization, eq(organization.id, blockPublications.organizationId)).where(and(eq(blockPublications.slug, slug), eq(blockPublications.ownerType, "organization"), eq(organization.slug, destination), or(eq(blockPublications.publicationState, "private"), and(eq(blockPublications.publicationState, "current"), eq(blockPublications.reviewStatus, "approved"))))).orderBy(desc(blockPublications.submittedAt)).limit(1)
  if (!row) throw new ORPCError("NOT_FOUND")
  return row.id
}
type AuthorizedOwner =
  | { ownerType: "platform"; organizationId: null; slug: string }
  | { ownerType: "organization"; organizationId: string; slug: string }

async function requirePlatformAdmin(userId: string) {
  const [admin] = await db.select({ id: user.id }).from(user).where(and(eq(user.id, userId), eq(user.role, "admin"))).limit(1)
  if (!admin) throw new ORPCError("FORBIDDEN")
}

async function requireOrganizationPublisher(userId: string, organizationId: string) {
  const [actor] = await db.select({ role: member.role }).from(member).where(and(eq(member.userId, userId), eq(member.organizationId, organizationId))).limit(1)
  if (!actor) throw new ORPCError("NOT_FOUND")
  if (!hasManagingRole(actor.role) || !(await hasOrganizationProEntitlement(userId, organizationId))) {
    throw new ORPCError("FORBIDDEN", { message: "Organization publishing requires a managing role and an assigned active Pro seat." })
  }
}

async function authorizeTemplateTarget(userId: string, destination: string, targetId: string): Promise<AuthorizedOwner> {
  const [row] = await db.select({ slug: templates.slug, ownerType: templates.ownerType, organizationId: templates.organizationId }).from(templates).where(eq(templates.id, targetId)).limit(1)
  if (!row) throw new ORPCError("NOT_FOUND")
  if (row.ownerType === "platform") {
    if (destination !== "deessejs") throw new ORPCError("FORBIDDEN")
    await requirePlatformAdmin(userId)
    return { ownerType: "platform", organizationId: null, slug: row.slug }
  }
  const organizationId = row.organizationId
  if (!organizationId) throw new ORPCError("NOT_FOUND")
  if (destination !== organizationId) {
    const [org] = await db.select({ id: organization.id }).from(organization).where(and(eq(organization.id, organizationId), eq(organization.slug, destination))).limit(1)
    if (!org) throw new ORPCError("FORBIDDEN")
  }
  await requireOrganizationPublisher(userId, organizationId)
  return { ownerType: "organization", organizationId, slug: row.slug }
}

async function authorizeBlockTarget(userId: string, destination: string, targetId: string): Promise<AuthorizedOwner> {
  const [row] = await db.select({ slug: blockPublications.slug, ownerType: blockPublications.ownerType, organizationId: blockPublications.organizationId, publicationState: blockPublications.publicationState, reviewStatus: blockPublications.reviewStatus }).from(blockPublications).where(eq(blockPublications.id, targetId)).limit(1)
  if (!row) throw new ORPCError("NOT_FOUND")
  if (row.ownerType === "platform") {
    if (row.publicationState !== "current" || row.reviewStatus !== "approved") throw new ORPCError("NOT_FOUND")
    if (destination !== "deessejs") throw new ORPCError("FORBIDDEN")
    await requirePlatformAdmin(userId)
    return { ownerType: "platform", organizationId: null, slug: row.slug }
  }
  if (row.publicationState !== "private" && (row.publicationState !== "current" || row.reviewStatus !== "approved")) throw new ORPCError("NOT_FOUND")
  const organizationId = row.organizationId
  if (!organizationId) throw new ORPCError("NOT_FOUND")
  const [org] = await db.select({ id: organization.id }).from(organization).where(and(eq(organization.id, organizationId), destination === organizationId ? undefined : eq(organization.slug, destination))).limit(1)
  if (!org) throw new ORPCError("FORBIDDEN")
  await requireOrganizationPublisher(userId, organizationId)
  return { ownerType: "organization", organizationId, slug: row.slug }
}

async function authorizeTarget(userId: string, target: Target): Promise<AuthorizedOwner> {
  return target.kind === "template"
    ? authorizeTemplateTarget(userId, target.destination, target.targetId)
    : authorizeBlockTarget(userId, target.destination, target.targetId)
}

const beginInput = z.object({
  kind: z.enum(["template", "block"]), slug: z.string().min(1).max(100), destination: z.string().min(1),
  version: z.string().regex(stableVersion), digest: z.string().regex(/^[a-f0-9]{64}$/), descriptorDigest: z.string().regex(/^[a-f0-9]{64}$/),
  archiveSize: z.number().int().positive().max(MAX_MANAGED_ARCHIVE_BYTES), idempotencyKey: z.string().uuid(),
})

async function resumeUploadAttempt(attempt: typeof managedReleaseUploads.$inferSelect, fingerprint: string) {
  if (attempt.requestFingerprint !== fingerprint) throw new ORPCError("CONFLICT", { message: "IDEMPOTENCY_KEY_REUSED" })
  const targetId = attempt.kind === "template" ? attempt.templateId : attempt.blockPublicationId
  if (!targetId) throw new ORPCError("CONFLICT", { message: "UPLOAD_ATTEMPT_EXPIRED" })
  const [release] = await db.select({ digest: managedReleases.digest, descriptorDigest: managedReleases.descriptorDigest }).from(managedReleases).where(and(
    attempt.kind === "template" ? eq(managedReleases.templateId, targetId) : eq(managedReleases.blockPublicationId, targetId),
    eq(managedReleases.version, attempt.version)
  )).limit(1)
  if (release?.digest === attempt.digest && release.descriptorDigest === attempt.descriptorDigest) {
    if (attempt.state === "pending") {
      await db.update(managedReleaseUploads).set({ state: "failed" }).where(and(eq(managedReleaseUploads.id, attempt.id), eq(managedReleaseUploads.state, "pending")))
      const { staging } = getManagedReleaseStorage()
      await staging.deleteObject(attempt.stagedKey)
    }
    return { uploadId: "", uploadUrl: "", alreadyPublished: true }
  }
  if (attempt.state === "completed") throw new ORPCError("CONFLICT", { message: "UPLOAD_ATTEMPT_EXPIRED" })
  if (attempt.state !== "pending" || attempt.expiresAt <= new Date()) throw new ORPCError("CONFLICT", { message: "UPLOAD_ATTEMPT_EXPIRED" })
  const { staging } = getManagedReleaseStorage()
  return { uploadId: attempt.id, uploadUrl: await staging.createUploadUrl({ key: attempt.stagedKey, contentType: "application/gzip", expiresInSeconds: 300 }), alreadyPublished: false }
}

const begin = base.input(beginInput).use(authGuard).handler(async ({ input, context }) => {
  const targetId = await findTarget(input.kind, input.slug, input.destination)
  const owner = await authorizeTarget(context.user.id, { ...input, targetId })
  const fingerprint = sha(Buffer.from(JSON.stringify({ ...input, destination: owner.organizationId ?? "deessejs", slug: owner.slug })))
  const [attempt] = await db.select().from(managedReleaseUploads).where(and(eq(managedReleaseUploads.createdBy, context.user.id), eq(managedReleaseUploads.idempotencyKey, input.idempotencyKey))).limit(1)
  if (attempt) return resumeUploadAttempt(attempt, fingerprint)
  const [sameVersion] = await db.select({ digest: managedReleases.digest, descriptorDigest: managedReleases.descriptorDigest }).from(managedReleases).where(and(input.kind === "template" ? eq(managedReleases.templateId, targetId) : eq(managedReleases.blockPublicationId, targetId), eq(managedReleases.version, input.version))).limit(1)
  if (sameVersion) {
    if (sameVersion.digest !== input.digest || sameVersion.descriptorDigest !== input.descriptorDigest) throw new ORPCError("CONFLICT", { message: "VERSION_ALREADY_PUBLISHED" })
    return { uploadId: "", uploadUrl: "", alreadyPublished: true }
  }
  const versions = await db.select({ version: managedReleases.version }).from(managedReleases).where(input.kind === "template" ? eq(managedReleases.templateId, targetId) : eq(managedReleases.blockPublicationId, targetId))
  const highest = versions.map((item) => item.version).sort(compareVersion).at(-1)
  if (highest && compareVersion(input.version, highest) <= 0) throw new ORPCError("CONFLICT", { message: "VERSION_NOT_NEWER" })
  const id = randomUUID()
  const stagedKey = `managed-releases/staging/${id}`
  const expiresAt = new Date(Date.now() + 15 * 60_000)
  const values = { id, idempotencyKey: input.idempotencyKey, requestFingerprint: fingerprint, kind: input.kind, ownerType: owner.ownerType, organizationId: owner.organizationId, templateId: input.kind === "template" ? targetId : null, blockPublicationId: input.kind === "block" ? targetId : null, slug: owner.slug, version: input.version, digest: input.digest, descriptorDigest: input.descriptorDigest, archiveSize: input.archiveSize, stagedKey, expiresAt, createdBy: context.user.id }
  const [created] = await db.insert(managedReleaseUploads).values(values)
    .onConflictDoNothing({ target: [managedReleaseUploads.createdBy, managedReleaseUploads.idempotencyKey] })
    .returning({ id: managedReleaseUploads.id })
  if (!created) {
    const [raced] = await db.select().from(managedReleaseUploads).where(and(eq(managedReleaseUploads.createdBy, context.user.id), eq(managedReleaseUploads.idempotencyKey, input.idempotencyKey))).limit(1)
    if (!raced) throw new ORPCError("CONFLICT", { message: "IDEMPOTENCY_KEY_REUSED" })
    return resumeUploadAttempt(raced, fingerprint)
  }
  const { staging } = getManagedReleaseStorage()
  return { uploadId: id, uploadUrl: await staging.createUploadUrl({ key: stagedKey, contentType: "application/gzip", expiresInSeconds: 300 }), alreadyPublished: false }
})

const finalize = base.input(z.object({ uploadId: z.string().uuid() })).use(authGuard).handler(async ({ input, context }) => {
  const [attempt] = await db.select().from(managedReleaseUploads).where(eq(managedReleaseUploads.id, input.uploadId)).limit(1)
  if (!attempt || attempt.createdBy !== context.user.id || attempt.state !== "pending" || attempt.expiresAt <= new Date()) throw new ORPCError("NOT_FOUND")
  const targetId = attempt.kind === "template" ? attempt.templateId : attempt.blockPublicationId
  if (!targetId) throw new ORPCError("NOT_FOUND")
  await authorizeTarget(context.user.id, { kind: attempt.kind, targetId, destination: attempt.organizationId ?? "deessejs" })
  const { staging, sealed } = getManagedReleaseStorage()
  const staged = await staging.getObject(attempt.stagedKey)
  const bytes = await readBody(staged.body, MAX_MANAGED_ARCHIVE_BYTES)
  if (bytes.byteLength !== attempt.archiveSize || sha(bytes) !== attempt.digest) throw new ORPCError("BAD_REQUEST", { message: "Uploaded archive size or digest does not match the publish request." })
  const inspected = await inspectManagedReleaseArchive({ archive: bytes, kind: attempt.kind, version: attempt.version })
  if (inspected.descriptorDigest !== attempt.descriptorDigest) throw new ORPCError("BAD_REQUEST", { message: "Embedded descriptor digest does not match the publish request." })

  const sealedKeys: string[] = []
  try {
    const result = await db.transaction(async (tx) => {
    const [locked] = await tx.select().from(managedReleaseUploads).where(eq(managedReleaseUploads.id, attempt.id)).for("update").limit(1)
    if (!locked || locked.state !== "pending" || locked.expiresAt <= new Date()) throw new ORPCError("CONFLICT", { message: "UPLOAD_ATTEMPT_EXPIRED" })
    await tx.update(managedReleaseUploads).set({ state: "sealing", fence: locked.fence + 1 }).where(eq(managedReleaseUploads.id, locked.id))
    if (attempt.kind === "template") await tx.select({ id: templates.id }).from(templates).where(eq(templates.id, targetId)).for("update").limit(1)
    else await tx.select({ id: blockPublications.id }).from(blockPublications).where(eq(blockPublications.id, targetId)).for("update").limit(1)
    const currentVersions = await tx.select({ version: managedReleases.version }).from(managedReleases).where(attempt.kind === "template" ? eq(managedReleases.templateId, targetId) : eq(managedReleases.blockPublicationId, targetId))
    const highest = currentVersions.map((item) => item.version).sort(compareVersion).at(-1)
    if (highest && compareVersion(attempt.version, highest) <= 0) {
      await tx.update(managedReleaseUploads).set({ state: "failed" }).where(eq(managedReleaseUploads.id, locked.id))
      throw new ORPCError("CONFLICT", { message: "VERSION_NOT_NEWER" })
    }
    const archiveKey = `managed-releases/sealed/${attempt.kind}/${attempt.ownerType}/${attempt.organizationId ?? "deessejs"}/${attempt.slug}/${attempt.version}/${randomUUID()}.tar.gz`
    await sealed.putObject({ key: archiveKey, body: bytes, contentLength: bytes.byteLength, contentType: "application/gzip", ifNoneMatch: "*" })
    sealedKeys.push(archiveKey)
    let previewKey: string | null = null
    if (inspected.preview) {
      previewKey = `managed-releases/previews/${attempt.kind}/${randomUUID()}`
      await sealed.putObject({ key: previewKey, body: inspected.preview.bytes, contentLength: inspected.preview.bytes.byteLength, contentType: inspected.preview.contentType, ifNoneMatch: "*" })
      sealedKeys.push(previewKey)
    }
    const [release] = await tx.insert(managedReleases).values({ kind: attempt.kind, ownerType: attempt.ownerType, organizationId: attempt.organizationId, templateId: attempt.templateId, blockPublicationId: attempt.blockPublicationId, slug: attempt.slug, version: attempt.version, archiveKey, digest: attempt.digest, descriptorDigest: inspected.descriptorDigest, previewKey, archiveSize: bytes.byteLength, publishedBy: context.user.id }).returning({ id: managedReleases.id, slug: managedReleases.slug, version: managedReleases.version, digest: managedReleases.digest, createdAt: managedReleases.createdAt })
    await tx.update(managedReleaseUploads).set({ state: "completed" }).where(eq(managedReleaseUploads.id, locked.id))
    if (!release) throw new ORPCError("INTERNAL_SERVER_ERROR")
    return { release: { ...release, createdAt: release.createdAt.toISOString() } }
    })
    await staging.deleteObject(attempt.stagedKey)
    return result
  } catch (error) {
    await Promise.all(sealedKeys.map((key) => sealed.deleteObject(key).catch(() => undefined)))
    throw error
  }
})

const list = base.input(z.object({ organizationSlug: z.string().optional() })).handler(async ({ input, context }) => {
  let orgId: string | undefined
  if (input.organizationSlug) {
    if (!context.user) throw new ORPCError("UNAUTHORIZED")
    const [org] = await db.select({ id: organization.id }).from(organization).innerJoin(member, eq(member.organizationId, organization.id)).where(and(eq(organization.slug, input.organizationSlug), eq(member.userId, context.user.id))).limit(1)
    if (!org) throw new ORPCError("FORBIDDEN")
    orgId = org.id
    if (!(await hasOrganizationProEntitlement(context.user.id, org.id))) throw new ORPCError("FORBIDDEN", { message: "An active assigned Pro seat is required to access organization releases." })
  }
  const rows = await db.select({ id: managedReleases.id, kind: managedReleases.kind, ownerType: managedReleases.ownerType, organizationId: managedReleases.organizationId, slug: managedReleases.slug, version: managedReleases.version, digest: managedReleases.digest, status: managedReleases.status, previewKey: managedReleases.previewKey, templateId: managedReleases.templateId, blockPublicationId: managedReleases.blockPublicationId }).from(managedReleases).where(and(eq(managedReleases.status, "ready"), orgId ? eq(managedReleases.organizationId, orgId) : eq(managedReleases.ownerType, "platform"))).orderBy(desc(managedReleases.createdAt))
  const hasPro = await callerHasActiveOrganizationPro(context)
  let paidTemplateIds = new Set<string>()
  let paidBlockIds = new Set<string>()
  if (!hasPro && !orgId) {
    paidTemplateIds = new Set((await db.select({ id: templates.id }).from(templates).where(eq(templates.access, "paid"))).map((row) => row.id))
    paidBlockIds = new Set((await db.select({ id: blockPublications.id }).from(blockPublications).where(eq(blockPublications.access, "paid"))).map((row) => row.id))
  }
  const releases = rows.filter((row) => releaseIsVisible(row, hasPro, paidTemplateIds, paidBlockIds))
  return { releases: releases.map(({ previewKey, ...row }) => ({ ...row, hasPreview: previewKey !== null })) }
})

function releaseIsVisible(
  row: { kind: string; templateId: string | null; blockPublicationId: string | null },
  hasPro: boolean,
  paidTemplateIds: Set<string>,
  paidBlockIds: Set<string>
) {
  if (hasPro) return true
  if (row.kind === "template") return row.templateId !== null && !paidTemplateIds.has(row.templateId)
  return row.blockPublicationId !== null && !paidBlockIds.has(row.blockPublicationId)
}

async function resolveOrganizationScope(organizationSlug: string | undefined, caller: { id: string } | null | undefined) {
  if (!organizationSlug) return undefined
  if (!caller) throw new ORPCError("UNAUTHORIZED")
  const [org] = await db.select({ id: organization.id }).from(organization).innerJoin(member, eq(member.organizationId, organization.id)).where(and(eq(organization.slug, organizationSlug), eq(member.userId, caller.id))).limit(1)
  if (!org) throw new ORPCError("NOT_FOUND")
  if (!(await hasOrganizationProEntitlement(caller.id, org.id))) {
    throw new ORPCError("FORBIDDEN", { message: "An active assigned Pro seat is required to access this organization release." })
  }
  return org.id
}

async function managedResolutionRequired(kind: "template" | "block", slug: string, ownerType: "platform" | "organization", organizationId?: string) {
  if (kind === "template") {
    const [target] = await db.select({ access: templates.access, sourceType: templates.sourceType }).from(templates).where(and(eq(templates.slug, slug), eq(templates.ownerType, ownerType), organizationId ? eq(templates.organizationId, organizationId) : undefined)).limit(1)
    return {
      required: ownerType === "organization" || target?.access === "paid" || target?.sourceType === "managed",
      paid: ownerType === "platform" && target?.access === "paid",
    }
  }
  const [target] = await db.select({ access: blockPublications.access }).from(blockPublications).where(and(eq(blockPublications.slug, slug), eq(blockPublications.ownerType, ownerType), organizationId ? eq(blockPublications.organizationId, organizationId) : undefined, ownerType === "platform" ? eq(blockPublications.publicationState, "current") : undefined)).orderBy(desc(blockPublications.submittedAt)).limit(1)
  return {
    required: ownerType === "organization" || target?.access === "paid",
    paid: ownerType === "platform" && target?.access === "paid",
  }
}

async function findEligibleRelease(input: { kind: "template" | "block"; slug: string; version?: string }, ownerType: "platform" | "organization", organizationId?: string) {
  const rows = await db.select().from(managedReleases).where(and(eq(managedReleases.kind, input.kind), eq(managedReleases.slug, input.slug), eq(managedReleases.ownerType, ownerType), organizationId ? eq(managedReleases.organizationId, organizationId) : eq(managedReleases.status, "ready"), input.version ? eq(managedReleases.version, input.version) : undefined)).orderBy(desc(managedReleases.createdAt))
  const eligible = rows.filter((row) => row.status === "ready").sort((a, b) => compareVersion(b.version, a.version))
  return input.version ? eligible.find((row) => row.version === input.version) : eligible[0]
}

async function authorizeResolvedRelease(release: typeof managedReleases.$inferSelect, context: Parameters<typeof callerHasActiveOrganizationPro>[0]) {
  if (release.ownerType === "organization") return
  let access: string | undefined
  if (release.kind === "template") {
    const targetId = release.templateId
    if (!targetId) throw new ORPCError("NOT_FOUND")
    const [target] = await db.select({ access: templates.access }).from(templates).where(eq(templates.id, targetId)).limit(1)
    access = target?.access
  } else {
    const targetId = release.blockPublicationId
    if (!targetId) throw new ORPCError("NOT_FOUND")
    const [target] = await db.select({ access: blockPublications.access }).from(blockPublications).where(eq(blockPublications.id, targetId)).limit(1)
    access = target?.access
  }
  if (access === "paid" && !(await callerHasActiveOrganizationPro(context))) {
    throw new ORPCError("FORBIDDEN", { message: "An active Pro seat is required to access this protected release." })
  }
}

const resolve = base.input(z.object({ kind: z.enum(["template", "block"]), slug: z.string().min(1), organizationSlug: z.string().optional(), version: z.string().regex(stableVersion).optional() })).handler(async ({ input, context }) => {
  const ownerType = input.organizationSlug ? "organization" : "platform"
  const orgId = await resolveOrganizationScope(input.organizationSlug, context.user)
  const resolution = await managedResolutionRequired(input.kind, input.slug, ownerType, orgId)
  if (!orgId && resolution.paid && !(await callerHasActiveOrganizationPro(context))) {
    throw new ORPCError("FORBIDDEN", { message: "An active Pro seat is required to access this protected release." })
  }
  const release = await findEligibleRelease({ kind: input.kind, slug: input.slug, ...(input.version ? { version: input.version } : {}) }, ownerType, orgId)
  if (!release) return { release: null, requiresManaged: resolution.required }
  await authorizeResolvedRelease(release, context)
  const { sealed } = getManagedReleaseStorage()
  return { release: { id: release.id, kind: release.kind, slug: release.slug, version: release.version, digest: release.digest, downloadUrl: await sealed.createDownloadUrl({ key: release.archiveKey, expiresInSeconds: 300 }), preview: release.previewKey ? await sealed.createDownloadUrl({ key: release.previewKey, expiresInSeconds: 300 }) : null }, requiresManaged: resolution.required }
})

const withdraw = base.input(z.object({ releaseId: z.string().uuid() })).use(authGuard).handler(async ({ input, context }) => {
  const [release] = await db.select().from(managedReleases).where(eq(managedReleases.id, input.releaseId)).limit(1)
  if (!release || release.status !== "ready") throw new ORPCError("NOT_FOUND")
  if (release.ownerType === "platform") {
    const [admin] = await db.select({ id: user.id }).from(user).where(and(eq(user.id, context.user.id), eq(user.role, "admin"))).limit(1)
    if (!admin) throw new ORPCError("FORBIDDEN")
  } else {
    const organizationId = release.organizationId
    if (!organizationId) throw new ORPCError("NOT_FOUND")
    const [actor] = await db.select({ role: member.role }).from(member).where(and(eq(member.userId, context.user.id), eq(member.organizationId, organizationId))).limit(1)
    if (!actor || !hasManagingRole(actor.role) || !(await hasOrganizationProEntitlement(context.user.id, organizationId))) throw new ORPCError("FORBIDDEN")
  }
  const [row] = await db.update(managedReleases).set({ status: "withdrawn", withdrawnAt: new Date() }).where(and(eq(managedReleases.id, input.releaseId), eq(managedReleases.status, "ready"))).returning({ id: managedReleases.id })
  if (!row) throw new ORPCError("NOT_FOUND")
  return row
})

const cleanupExpired = adminProcedure.input(z.object({ limit: z.number().int().min(1).max(100).default(50) })).handler(async ({ input }) => {
  return cleanupExpiredManagedReleaseUploads(input.limit)
})

export const managedReleasesRouter = { begin, finalize, list, resolve, withdraw, cleanupExpired }
