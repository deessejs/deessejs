import { randomUUID } from "node:crypto"
import { and, eq, lte } from "drizzle-orm"
import sharp from "sharp"
import {
  db,
  storageObjects,
  templateImageUploads,
  templatePublications,
  templates,
  member,
  user,
} from "@workspace/database"
import { hasManagingRole } from "@workspace/auth/organization/roles"
import { getAvatarStorage } from "../avatars/storage.js"

const MAX_BYTES = 5 * 1024 * 1024
const TYPES = ["image/jpeg", "image/png", "image/webp"] as const
const isType = (value: string): value is (typeof TYPES)[number] =>
  TYPES.some((type) => type === value)

async function authorize(templateId: string, userId: string) {
  const [template] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, templateId))
    .limit(1)
  if (!template) throw new Error("TEMPLATE_IMAGE_NOT_FOUND")
  const [actor] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  if (template.ownerType === "platform") {
    if (actor?.role !== "admin") throw new Error("TEMPLATE_IMAGE_FORBIDDEN")
  } else {
    if (!template.organizationId) throw new Error("TEMPLATE_IMAGE_FORBIDDEN")
    const [membership] = await db
      .select({ role: member.role })
      .from(member)
      .where(
        and(
          eq(member.organizationId, template.organizationId),
          eq(member.userId, userId)
        )
      )
      .limit(1)
    if (!membership || !hasManagingRole(membership.role))
      throw new Error("TEMPLATE_IMAGE_FORBIDDEN")
  }
  return template
}

export async function createTemplateImageUpload(
  templateId: string,
  userId: string,
  contentType: string,
  byteSize: number
) {
  const template = await authorize(templateId, userId)
  if (
    !isType(contentType) ||
    !Number.isInteger(byteSize) ||
    byteSize < 1 ||
    byteSize > MAX_BYTES
  )
    throw new Error("TEMPLATE_IMAGE_INVALID")
  const id = randomUUID()
  const stagedKey = `template-images/staging/${id}`
  const objectKey = `template-images/final/${id}.webp`
  const expiresAt = new Date(Date.now() + 300_000)
  const [object] = await db
    .insert(storageObjects)
    .values({ objectKey, state: "pending", createdByUserId: userId })
    .returning({ id: storageObjects.id })
  if (!object) throw new Error("TEMPLATE_IMAGE_INVALID")
  const [upload] = await db
    .insert(templateImageUploads)
    .values({
      templateId,
      objectId: object.id,
      stagedKey,
      userId,
      organizationId: template.organizationId,
      expectedContentType: contentType,
      expectedByteSize: byteSize,
      expiresAt,
    })
    .returning({ id: templateImageUploads.id })
  if (!upload) throw new Error("TEMPLATE_IMAGE_INVALID")
  const uploadUrl = await getAvatarStorage().createUploadUrl({
    key: stagedKey,
    contentType,
    expiresInSeconds: 300,
  })
  return {
    uploadId: upload.id,
    uploadUrl,
    requiredHeaders: { "Content-Type": contentType },
    expiresAt: expiresAt.toISOString(),
  }
}

export async function completeTemplateImageUpload(
  templateId: string,
  userId: string,
  uploadId: string
) {
  await authorize(templateId, userId)
  const [upload] = await db
    .select()
    .from(templateImageUploads)
    .where(
      and(
        eq(templateImageUploads.id, uploadId),
        eq(templateImageUploads.templateId, templateId),
        eq(templateImageUploads.userId, userId)
      )
    )
    .limit(1)
  if (!upload || upload.expiresAt.getTime() < Date.now())
    throw new Error("TEMPLATE_IMAGE_NOT_FOUND")
  const storage = getAvatarStorage()
  const metadata = await storage.headObject(upload.stagedKey)
  if (
    metadata.contentLength !== upload.expectedByteSize ||
    metadata.contentType !== upload.expectedContentType ||
    metadata.contentLength > MAX_BYTES
  )
    throw new Error("TEMPLATE_IMAGE_INVALID")
  const source = await storage.getObject(upload.stagedKey)
  if (!source.body) throw new Error("TEMPLATE_IMAGE_INVALID")
  const chunks: Buffer[] = []
  let size = 0
  for await (const part of source.body) {
    const chunk = Buffer.isBuffer(part) ? part : Buffer.from(part)
    size += chunk.length
    if (size > MAX_BYTES) throw new Error("TEMPLATE_IMAGE_INVALID")
    chunks.push(chunk)
  }
  const input = Buffer.concat(chunks)
  const image = sharp(input, {
    failOn: "warning",
    limitInputPixels: 16_000_000,
    pages: 1,
  })
  const meta = await image.metadata()
  const actualType =
    meta.format === "jpeg"
      ? "image/jpeg"
      : meta.format === "png"
        ? "image/png"
        : meta.format === "webp"
          ? "image/webp"
          : null
  const invalidDimensions =
    !meta.width ||
    !meta.height ||
    meta.width > 4096 ||
    meta.height > 4096 ||
    meta.width * meta.height > 16_000_000
  if (
    actualType !== upload.expectedContentType ||
    (meta.pages ?? 1) !== 1 ||
    invalidDimensions
  )
    throw new Error("TEMPLATE_IMAGE_INVALID")
  const output = await image.autoOrient().webp().toBuffer()
  if (!output.length || output.length > MAX_BYTES)
    throw new Error("TEMPLATE_IMAGE_INVALID")
  const [object] = await db
    .select({ key: storageObjects.objectKey })
    .from(storageObjects)
    .where(eq(storageObjects.id, upload.objectId))
    .limit(1)
  if (!object) throw new Error("TEMPLATE_IMAGE_NOT_FOUND")
  await storage.putObject({
    key: object.key,
    body: output,
    contentType: "image/webp",
    contentLength: output.length,
  })
  await db.transaction(async (tx) => {
    const [template] = await tx
      .select()
      .from(templates)
      .where(eq(templates.id, templateId))
      .for("update")
      .limit(1)
    if (!template) throw new Error("TEMPLATE_IMAGE_NOT_FOUND")
    const previousId = template.imageObjectId
    await tx
      .update(storageObjects)
      .set({
        state: "ready",
        contentType: "image/webp",
        byteSize: output.length,
        verifiedAt: new Date(),
      })
      .where(eq(storageObjects.id, upload.objectId))
    await tx
      .update(templates)
      .set({ imageObjectId: upload.objectId })
      .where(eq(templates.id, templateId))
    await tx
      .delete(templateImageUploads)
      .where(eq(templateImageUploads.id, upload.id))
    if (previousId && previousId !== upload.objectId) {
      const [publicationReference] = await tx
        .select({ id: templatePublications.id })
        .from(templatePublications)
        .where(
          and(
            eq(templatePublications.imageObjectId, previousId),
            eq(templatePublications.publicationState, "current")
          )
        )
        .limit(1)
      if (!publicationReference)
        await tx
          .update(storageObjects)
          .set({ state: "delete_pending", cleanupAfter: new Date() })
          .where(eq(storageObjects.id, previousId))
    }
  })
  try {
    await storage.deleteObject(upload.stagedKey)
  } catch {
    /* expired staging cleanup handles retry */
  }
  return { imageUrl: `/api/v1/images/${upload.objectId}` }
}

export async function cleanupTemplateImageUploads() {
  const expired = await db
    .select()
    .from(templateImageUploads)
    .where(lte(templateImageUploads.expiresAt, new Date()))
    .limit(100)
  let cleaned = 0
  for (const upload of expired) {
    try {
      const [object] = await db
        .select({ key: storageObjects.objectKey })
        .from(storageObjects)
        .where(eq(storageObjects.id, upload.objectId))
        .limit(1)
      await getAvatarStorage().deleteObject(upload.stagedKey)
      if (object) await getAvatarStorage().deleteObject(object.key)
      await db
        .delete(templateImageUploads)
        .where(eq(templateImageUploads.id, upload.id))
      await db
        .delete(storageObjects)
        .where(eq(storageObjects.id, upload.objectId))
      cleaned += 1
    } catch {
      // Keep the row so the next cleanup run can retry the object deletion.
    }
  }
  return { cleaned, count: expired.length }
}
