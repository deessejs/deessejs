import { and, eq, isNull, lte } from "drizzle-orm"
import { db } from "@workspace/database"
import { hasManagingRole } from "@workspace/auth/organization/roles"
import {
  member,
  organizationAvatars,
  storageObjects,
  storageUploads,
  userAvatars,
} from "@workspace/database/schema"
import {
  AVATAR_INPUT_TYPES,
  AVATAR_MAX_BYTES,
  normalizeAvatar,
} from "./image.js"
import { createAvatarKeys, getAvatarStorage } from "./storage.js"
import { API_BASE_PATH } from "../../constants/base-path.js"

const UPLOAD_EXPIRY_SECONDS = 300
const CLEANUP_RETENTION_MS = 24 * 60 * 60 * 1000

type AvatarTarget =
  | { kind: "user"; userId: string }
  | { kind: "organization"; organizationId: string; userId: string }

const isInputType = (
  value: string
): value is (typeof AVATAR_INPUT_TYPES)[number] =>
  AVATAR_INPUT_TYPES.some((type) => type === value)

export function avatarImageUrl(objectId: string) {
  return `${API_BASE_PATH}/images/${objectId}`
}

export async function createAvatarUpload(
  target: AvatarTarget,
  contentType: string,
  byteSize: number
) {
  if (
    !isInputType(contentType) ||
    !Number.isInteger(byteSize) ||
    byteSize < 1 ||
    byteSize > AVATAR_MAX_BYTES
  ) {
    throw new Error("AVATAR_UPLOAD_INVALID")
  }

  const storage = getAvatarStorage()
  const { objectKey, stagedKey } = createAvatarKeys()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + UPLOAD_EXPIRY_SECONDS * 1000)
  const cleanupAfter = new Date(now.getTime() + CLEANUP_RETENTION_MS)
  const [object] = await db
    .insert(storageObjects)
    .values({
      objectKey,
      state: "pending",
      createdByUserId: target.userId,
      cleanupAfter,
    })
    .returning({ id: storageObjects.id })

  if (!object) throw new Error("Could not create avatar upload.")

  const [upload] = await db
    .insert(storageUploads)
    .values({
      objectId: object.id,
      stagedKey,
      userId: target.userId,
      organizationId:
        target.kind === "organization" ? target.organizationId : null,
      expectedContentType: contentType,
      expectedByteSize: byteSize,
      expiresAt,
      cleanupAfter,
    })
    .returning({ id: storageUploads.id })

  if (!upload) throw new Error("Could not create avatar upload.")

  try {
    const uploadUrl = await storage.createUploadUrl({
      key: stagedKey,
      contentType,
      expiresInSeconds: UPLOAD_EXPIRY_SECONDS,
    })
    return {
      uploadId: upload.id,
      uploadUrl,
      requiredHeaders: { "Content-Type": contentType },
      expiresAt: expiresAt.toISOString(),
    }
  } catch (error) {
    await db.delete(storageObjects).where(eq(storageObjects.id, object.id))
    throw error
  }
}

async function readBoundedObject(key: string): Promise<Buffer> {
  const object = await getAvatarStorage().getObject(key)
  if (!object.body) throw new Error("Avatar upload is missing.")
  if (
    object.contentLength !== undefined &&
    object.contentLength > AVATAR_MAX_BYTES
  ) {
    throw new Error("AVATAR_UPLOAD_INVALID")
  }

  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of object.body) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += bytes.byteLength
    if (size > AVATAR_MAX_BYTES) throw new Error("AVATAR_UPLOAD_INVALID")
    chunks.push(bytes)
  }
  return Buffer.concat(chunks, size)
}

async function discardUpload(
  uploadId: string,
  objectId: string,
  stagedKey: string
) {
  const now = new Date()
  await db
    .update(storageUploads)
    .set({ state: "delete_pending", cleanupAfter: now })
    .where(eq(storageUploads.id, uploadId))
  await db
    .update(storageObjects)
    .set({ state: "delete_pending", cleanupAfter: now })
    .where(eq(storageObjects.id, objectId))
  await deleteStaged(stagedKey)
}

async function deleteStaged(key: string) {
  try {
    await getAvatarStorage().deleteObject(key)
    return true
  } catch {
    return false
  }
}

async function removeObject(objectId: string) {
  const [object] = await db
    .select({ id: storageObjects.id, objectKey: storageObjects.objectKey })
    .from(storageObjects)
    .where(eq(storageObjects.id, objectId))
    .limit(1)
  if (!object) return

  try {
    await getAvatarStorage().deleteObject(object.objectKey)
    await db.delete(storageObjects).where(eq(storageObjects.id, object.id))
  } catch {
    // Keep the delete_pending row so the cleanup request can retry it.
  }
}

async function markObjectForCleanup(
  transaction: Parameters<Parameters<typeof db.transaction>[0]>[0],
  objectId: string
) {
  const [upload] = await transaction
    .select({ cleanupAfter: storageUploads.cleanupAfter })
    .from(storageUploads)
    .where(eq(storageUploads.objectId, objectId))
    .limit(1)
  await transaction
    .update(storageObjects)
    .set({
      state: "delete_pending",
      cleanupAfter: upload?.cleanupAfter ?? new Date(),
    })
    .where(eq(storageObjects.id, objectId))
}

export async function completeAvatarUpload(
  target: AvatarTarget,
  uploadId: string
) {
  const [upload] = await db
    .select()
    .from(storageUploads)
    .where(
      and(
        eq(storageUploads.id, uploadId),
        eq(storageUploads.userId, target.userId),
        target.kind === "organization"
          ? eq(storageUploads.organizationId, target.organizationId)
          : isNull(storageUploads.organizationId),
        eq(storageUploads.state, "pending")
      )
    )
    .limit(1)
  if (!upload) throw new Error("AVATAR_UPLOAD_NOT_FOUND")

  const storage = getAvatarStorage()
  try {
    const metadata = await storage.headObject(upload.stagedKey)
    if (
      metadata.contentLength !== upload.expectedByteSize ||
      metadata.contentType !== upload.expectedContentType ||
      Date.now() > upload.expiresAt.getTime()
    ) {
      throw new Error("AVATAR_UPLOAD_INVALID")
    }

    const input = await readBoundedObject(upload.stagedKey)
    if (input.byteLength !== upload.expectedByteSize) {
      throw new Error("AVATAR_UPLOAD_INVALID")
    }
    const normalized = await normalizeAvatar(input, upload.expectedContentType)
    const [targetObject] = await db
      .select({ objectKey: storageObjects.objectKey })
      .from(storageObjects)
      .where(eq(storageObjects.id, upload.objectId))
      .limit(1)
    if (!targetObject) throw new Error("AVATAR_UPLOAD_NOT_FOUND")
    await storage.putObject({
      key: targetObject.objectKey,
      body: normalized,
      contentLength: normalized.byteLength,
      contentType: "image/webp",
    })

    await db.transaction(async (tx) => {
      const [locked] = await tx
        .select({ state: storageUploads.state })
        .from(storageUploads)
        .where(eq(storageUploads.id, upload.id))
        .for("update")
        .limit(1)
      if (locked?.state !== "pending")
        throw new Error("AVATAR_UPLOAD_NOT_FOUND")

      if (target.kind === "organization") {
        const [membership] = await tx
          .select({ role: member.role })
          .from(member)
          .where(
            and(
              eq(member.organizationId, target.organizationId),
              eq(member.userId, target.userId)
            )
          )
          .for("update")
          .limit(1)
        if (!membership || !hasManagingRole(membership.role)) {
          throw new Error("AVATAR_ACCESS_DENIED")
        }
      }

      const ownerId =
        target.kind === "user" ? target.userId : target.organizationId
      const [previous] =
        target.kind === "user"
          ? await tx
              .select({ objectId: userAvatars.objectId })
              .from(userAvatars)
              .where(eq(userAvatars.userId, ownerId))
              .limit(1)
          : await tx
              .select({ objectId: organizationAvatars.objectId })
              .from(organizationAvatars)
              .where(eq(organizationAvatars.organizationId, ownerId))
              .limit(1)

      await tx
        .update(storageObjects)
        .set({
          state: "ready",
          contentType: "image/webp",
          byteSize: normalized.byteLength,
          verifiedAt: new Date(),
          cleanupAfter: null,
        })
        .where(eq(storageObjects.id, upload.objectId))

      if (target.kind === "user") {
        await tx
          .insert(userAvatars)
          .values({ userId: ownerId, objectId: upload.objectId })
          .onConflictDoUpdate({
            target: userAvatars.userId,
            set: { objectId: upload.objectId, updatedAt: new Date() },
          })
      } else {
        await tx
          .insert(organizationAvatars)
          .values({ organizationId: ownerId, objectId: upload.objectId })
          .onConflictDoUpdate({
            target: organizationAvatars.organizationId,
            set: { objectId: upload.objectId, updatedAt: new Date() },
          })
      }

      await tx
        .update(storageUploads)
        .set({ state: "promoted" })
        .where(eq(storageUploads.id, upload.id))

      const oldId = previous?.objectId
      if (oldId && oldId !== upload.objectId) {
        await markObjectForCleanup(tx, oldId)
      }
    })

    return { imageUrl: avatarImageUrl(upload.objectId) }
  } catch (error) {
    if (error instanceof Error && error.message === "AVATAR_UPLOAD_NOT_FOUND")
      throw error
    await discardUpload(upload.id, upload.objectId, upload.stagedKey)
    if (error instanceof Error && error.message === "AVATAR_UPLOAD_INVALID")
      throw error
    throw error
  }
}

export async function getUserAvatar(userId: string) {
  const [avatar] = await db
    .select({ objectId: userAvatars.objectId })
    .from(userAvatars)
    .innerJoin(storageObjects, eq(storageObjects.id, userAvatars.objectId))
    .where(
      and(eq(userAvatars.userId, userId), eq(storageObjects.state, "ready"))
    )
    .limit(1)
  return avatar
    ? { imageUrl: avatarImageUrl(avatar.objectId) }
    : { imageUrl: null }
}

export async function getOrganizationAvatar(organizationId: string) {
  const [avatar] = await db
    .select({ objectId: organizationAvatars.objectId })
    .from(organizationAvatars)
    .innerJoin(
      storageObjects,
      eq(storageObjects.id, organizationAvatars.objectId)
    )
    .where(
      and(
        eq(organizationAvatars.organizationId, organizationId),
        eq(storageObjects.state, "ready")
      )
    )
    .limit(1)
  return avatar
    ? { imageUrl: avatarImageUrl(avatar.objectId) }
    : { imageUrl: null }
}

export async function removeUserAvatar(userId: string) {
  await db.transaction(async (tx) => {
    const [avatar] = await tx
      .select({ objectId: userAvatars.objectId })
      .from(userAvatars)
      .where(eq(userAvatars.userId, userId))
      .limit(1)
    if (!avatar) return
    await tx.delete(userAvatars).where(eq(userAvatars.userId, userId))
    await markObjectForCleanup(tx, avatar.objectId)
  })
  return { success: true as const }
}

export async function removeOrganizationAvatar(organizationId: string) {
  await db.transaction(async (tx) => {
    const [avatar] = await tx
      .select({ objectId: organizationAvatars.objectId })
      .from(organizationAvatars)
      .where(eq(organizationAvatars.organizationId, organizationId))
      .limit(1)
    if (!avatar) return
    await tx
      .delete(organizationAvatars)
      .where(eq(organizationAvatars.organizationId, organizationId))
    await markObjectForCleanup(tx, avatar.objectId)
  })
  return { success: true as const }
}

export async function cleanupAvatars() {
  const now = new Date()
  const expiredUploads = await db
    .select({
      id: storageUploads.id,
      objectId: storageUploads.objectId,
      stagedKey: storageUploads.stagedKey,
      state: storageUploads.state,
    })
    .from(storageUploads)
    .where(lte(storageUploads.cleanupAfter, now))
    .limit(100)
  let cleaned = 0

  for (const upload of expiredUploads) {
    if (!(await deleteStaged(upload.stagedKey))) continue
    if (upload.state === "pending") {
      const [object] = await db
        .select({ objectKey: storageObjects.objectKey })
        .from(storageObjects)
        .where(eq(storageObjects.id, upload.objectId))
        .limit(1)
      if (object) {
        try {
          await getAvatarStorage().deleteObject(object.objectKey)
          await db
            .delete(storageObjects)
            .where(eq(storageObjects.id, upload.objectId))
        } catch {
          await db
            .update(storageObjects)
            .set({ state: "delete_pending", cleanupAfter: now })
            .where(eq(storageObjects.id, upload.objectId))
          continue
        }
      }
    }
    await db.delete(storageUploads).where(eq(storageUploads.id, upload.id))
    cleaned += 1
  }

  const expiredObjects = await db
    .select({ id: storageObjects.id, objectKey: storageObjects.objectKey })
    .from(storageObjects)
    .where(
      and(
        eq(storageObjects.state, "delete_pending"),
        lte(storageObjects.cleanupAfter, now)
      )
    )
    .limit(100)
  for (const object of expiredObjects) {
    await removeObject(object.id)
    cleaned += 1
  }
  return { cleaned }
}
