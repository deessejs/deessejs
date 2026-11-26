import { and, eq, inArray, lte, or } from "drizzle-orm"
import { db, managedReleaseUploads } from "@workspace/database"
import { getManagedReleaseStorage } from "./storage.js"

/** Marks expired transfers and removes staging objects in bounded, retryable batches. */
export async function cleanupExpiredManagedReleaseUploads(limit = 50): Promise<{ deleted: number }> {
  const now = new Date()
  const candidates = await db.select({ id: managedReleaseUploads.id }).from(managedReleaseUploads).where(or(
    eq(managedReleaseUploads.state, "expired"),
    and(eq(managedReleaseUploads.state, "pending"), lte(managedReleaseUploads.expiresAt, now))
  )).limit(limit)
  if (candidates.length === 0) return { deleted: 0 }
  const candidateIds = candidates.map(({ id }) => id)
  await db.update(managedReleaseUploads).set({ state: "expired" }).where(and(
    inArray(managedReleaseUploads.id, candidateIds),
    eq(managedReleaseUploads.state, "pending"),
    lte(managedReleaseUploads.expiresAt, now)
  ))
  const expired = await db.select({ id: managedReleaseUploads.id, stagedKey: managedReleaseUploads.stagedKey }).from(managedReleaseUploads).where(and(inArray(managedReleaseUploads.id, candidateIds), eq(managedReleaseUploads.state, "expired")))
  if (expired.length === 0) return { deleted: 0 }
  const { staging } = getManagedReleaseStorage()
  await Promise.all(expired.map(({ stagedKey }) => staging.deleteObject(stagedKey)))
  await db.delete(managedReleaseUploads).where(inArray(managedReleaseUploads.id, expired.map(({ id }) => id)))
  return { deleted: expired.length }
}
