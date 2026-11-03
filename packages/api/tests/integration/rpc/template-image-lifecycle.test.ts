/**
 * @testClass integration
 * @database postgres
 */
import { randomUUID } from "node:crypto"
import { Readable } from "node:stream"
import { eq } from "drizzle-orm"
import { describe, expect, inject, it, vi } from "vitest"
import { db } from "@workspace/database"
import {
  organization,
  storageObjects,
  templatePublications,
  templates,
  user,
} from "@workspace/database/schema"
import { transitionPendingPublicationImageReference } from "../../../src/core/templates/images.js"
import { api } from "../../../src/index.js"

const storageFake = vi.hoisted(() => ({
  storage: {
    async getObject() {
      const body = Buffer.from("image-bytes")
      return { body: Readable.from([body]), contentLength: body.length }
    },
  },
}))
vi.mock("../../../src/core/avatars/storage.js", () => ({
  getAvatarStorage: () => storageFake.storage,
}))

const POSTGRES_READY = inject("postgres:ready") === true

async function fixture() {
  const orgId = `image-org-${randomUUID()}`
  const userId = `image-user-${randomUUID()}`
  const objectId = randomUUID()
  const templateId = randomUUID()
  const publicationId = randomUUID()
  await db.insert(user).values({
    id: userId,
    name: userId,
    email: `${userId}@example.com`,
    emailVerified: true,
  })
  await db.insert(organization).values({
    id: orgId,
    name: orgId,
    slug: `org-${randomUUID().slice(0, 8)}`,
    createdAt: new Date(),
  })
  await db.insert(storageObjects).values({
    id: objectId,
    objectKey: `template-images/test/${objectId}.webp`,
    state: "ready",
    contentType: "image/webp",
    byteSize: 20,
    verifiedAt: new Date(),
  })
  await db.insert(templates).values({
    id: templateId,
    slug: `tpl-${randomUUID().slice(0, 8)}`,
    ownerType: "organization",
    organizationId: orgId,
    name: "Lifecycle fixture",
    owner: "owner",
    repo: "repo",
    category: "saas",
    imageObjectId: null,
  })
  await db.insert(templatePublications).values({
    id: publicationId,
    templateId,
    organizationId: orgId,
    organizationSlug: "fixture-org",
    organizationName: "Fixture",
    submittedBy: userId,
    sourceCommit: "a".repeat(40),
    slug: "fixture",
    name: "Fixture",
    description: "Fixture",
    owner: "owner",
    repo: "repo",
    category: "saas",
    license: "MIT",
    repositoryName: "repo",
    canonicalUrl: "https://github.com/owner/repo",
    distributionRightsConfirmed: true,
    imageObjectId: objectId,
  })
  return { orgId, userId, objectId, templateId, publicationId }
}

async function dispose(value: Awaited<ReturnType<typeof fixture>>) {
  await db
    .delete(templatePublications)
    .where(eq(templatePublications.id, value.publicationId))
  await db
    .update(templates)
    .set({ imageObjectId: null })
    .where(eq(templates.id, value.templateId))
  await db.delete(templates).where(eq(templates.id, value.templateId))
  await db.delete(storageObjects).where(eq(storageObjects.id, value.objectId))
  await db.delete(organization).where(eq(organization.id, value.orgId))
  await db.delete(user).where(eq(user.id, value.userId))
}

describe("terminal template publication image references", () => {
  if (!POSTGRES_READY) {
    it.skip("requires Postgres", () => {})
  } else {
    it.each(["rejected", "withdrawn"] as const)(
      "detaches a %s snapshot and schedules its unreferenced object",
      async (status) => {
        const value = await fixture()
        try {
          await db.transaction((tx) =>
            transitionPendingPublicationImageReference(
              tx,
              value.publicationId,
              status
            )
          )
          const [publication] = await db
            .select({ imageObjectId: templatePublications.imageObjectId })
            .from(templatePublications)
            .where(eq(templatePublications.id, value.publicationId))
          const [object] = await db
            .select({ state: storageObjects.state })
            .from(storageObjects)
            .where(eq(storageObjects.id, value.objectId))
          expect(publication?.imageObjectId).toBeNull()
          expect(object?.state).toBe("delete_pending")
        } finally {
          await dispose(value)
        }
      }
    )

    it("detaches a terminal snapshot but retains an image shared with the working template", async () => {
      const value = await fixture()
      try {
        await db
          .update(templates)
          .set({ imageObjectId: value.objectId })
          .where(eq(templates.id, value.templateId))
        await db.transaction((tx) =>
          transitionPendingPublicationImageReference(
            tx,
            value.publicationId,
            "rejected"
          )
        )
        const [publication] = await db
          .select({ imageObjectId: templatePublications.imageObjectId })
          .from(templatePublications)
          .where(eq(templatePublications.id, value.publicationId))
        const [object] = await db
          .select({ state: storageObjects.state })
          .from(storageObjects)
          .where(eq(storageObjects.id, value.objectId))
        expect(publication?.imageObjectId).toBeNull()
        expect(object?.state).toBe("ready")
      } finally {
        await dispose(value)
      }
    })

    it("detaches a terminal snapshot but retains an image shared with a current publication", async () => {
      const value = await fixture()
      const currentPublicationId = randomUUID()
      try {
        await db.insert(templatePublications).values({
          id: currentPublicationId,
          templateId: value.templateId,
          organizationId: value.orgId,
          organizationSlug: "fixture-org",
          organizationName: "Fixture",
          submittedBy: value.userId,
          sourceCommit: "b".repeat(40),
          slug: "fixture-current",
          name: "Current fixture",
          description: "Fixture",
          owner: "owner",
          repo: "repo",
          category: "saas",
          license: "MIT",
          repositoryName: "repo",
          canonicalUrl: "https://github.com/owner/repo",
          distributionRightsConfirmed: true,
          reviewStatus: "approved",
          publicationState: "current",
          imageObjectId: value.objectId,
        })
        await db.transaction((tx) =>
          transitionPendingPublicationImageReference(
            tx,
            value.publicationId,
            "withdrawn"
          )
        )
        const [terminal] = await db
          .select({ imageObjectId: templatePublications.imageObjectId })
          .from(templatePublications)
          .where(eq(templatePublications.id, value.publicationId))
        const [object] = await db
          .select({ state: storageObjects.state })
          .from(storageObjects)
          .where(eq(storageObjects.id, value.objectId))
        expect(terminal?.imageObjectId).toBeNull()
        expect(object?.state).toBe("ready")
      } finally {
        await db
          .delete(templatePublications)
          .where(eq(templatePublications.id, currentPublicationId))
        await dispose(value)
      }
    })

    it("serves only current approved snapshots publicly and hides working images anonymously", async () => {
      const value = await fixture()
      try {
        await db
          .update(templates)
          .set({ imageObjectId: value.objectId })
          .where(eq(templates.id, value.templateId))
        const privateResponse = await api.request(
          `/api/v1/images/${value.objectId}`
        )
        expect(privateResponse.status).toBe(404)

        await db
          .update(templatePublications)
          .set({ reviewStatus: "approved", publicationState: "current" })
          .where(eq(templatePublications.id, value.publicationId))
        const publicResponse = await api.request(
          `/api/v1/images/${value.objectId}`
        )
        expect(publicResponse.status).toBe(200)
        expect(publicResponse.headers.get("cache-control")).toContain(
          "max-age=300"
        )
        expect(Buffer.from(await publicResponse.arrayBuffer()).toString()).toBe(
          "image-bytes"
        )
      } finally {
        await db
          .update(templatePublications)
          .set({ imageObjectId: null })
          .where(eq(templatePublications.id, value.publicationId))
        await dispose(value)
      }
    })
  }
})
