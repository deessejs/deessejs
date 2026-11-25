/**
 * @testClass integration
 * @database postgres
 */
import { createHash, randomUUID } from "node:crypto"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Readable } from "node:stream"
import { c } from "tar"
import { call } from "@orpc/server"
import { eq } from "drizzle-orm"
import { afterEach, describe, expect, inject, it } from "vitest"
import { blockPublications, db, managedReleases, member, organization, organizationProSeat, subscription, templates, user } from "@workspace/database"
import type { ObjectStorage } from "@workspace/storage"
import { setManagedReleaseStorageForTests } from "../../../src/core/managed-releases/storage.js"
import { appRouter } from "../../../src/orpc/index.js"
import { api } from "../../../src/index.js"

const POSTGRES_READY = inject("postgres:ready") === true
const fakeStore: ObjectStorage = {
  async copyObject() {},
  async createDownloadUrl({ key }) { return `https://r2.invalid/${key}` },
  async createUploadUrl({ key }) { return `https://upload.invalid/${key}` },
  async deleteObject() {},
  async getObject() { return { body: Readable.from([]) } },
  async headObject() { return {} },
  async putObject() {},
}

afterEach(() => setManagedReleaseStorageForTests(undefined))

describe("managed release resolution", () => {
  if (!POSTGRES_READY) {
    it.skip("requires Postgres", () => {})
  } else {
    it("uses the highest ready release and falls back after withdrawal", async () => {
      const suffix = randomUUID()
      const userId = `managed-${suffix}`
      const templateId = randomUUID()
      const slug = `managed-${suffix.slice(0, 8)}`
      const ids = [randomUUID(), randomUUID()]
      await db.insert(user).values({ id: userId, name: userId, email: `${userId}@example.test`, emailVerified: true })
      await db.insert(templates).values({ id: templateId, slug, ownerType: "platform", name: slug, owner: "fixture", repo: slug, category: "saas" })
      await db.insert(managedReleases).values([
        { id: ids[0], kind: "template", ownerType: "platform", templateId, slug, version: "1.0.0", archiveKey: `sealed/${suffix}/1.0.0`, digest: "a".repeat(64), descriptorDigest: "b".repeat(64), archiveSize: 10, publishedBy: userId },
        { id: ids[1], kind: "template", ownerType: "platform", templateId, slug, version: "1.2.0", archiveKey: `sealed/${suffix}/1.2.0`, digest: "c".repeat(64), descriptorDigest: "d".repeat(64), archiveSize: 10, publishedBy: userId },
      ])
      setManagedReleaseStorageForTests({ staging: fakeStore, sealed: fakeStore })
      try {
        const path = ["managedReleases", "resolve"]
        const request = () => api.request("/api/v1/rpc/managedReleases/resolve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ json: { kind: "template", slug }, path }) })
        const latest = await request()
        expect(latest.status).toBe(200)
        expect((await latest.json()).json.release.version).toBe("1.2.0")
        const withdrawnId = ids[1]
        if (!withdrawnId) throw new Error("Expected a second seeded managed release.")
        await db.update(managedReleases).set({ status: "withdrawn", withdrawnAt: new Date() }).where(eq(managedReleases.id, withdrawnId))
        const fallback = await request()
        expect(fallback.status).toBe(200)
        expect((await fallback.json()).json.release.version).toBe("1.0.0")
        const withdrawn = await api.request("/api/v1/rpc/managedReleases/resolve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ json: { kind: "template", slug, version: "1.2.0" }, path }) })
        expect((await withdrawn.json()).json.release).toBeNull()
      } finally {
        await db.delete(managedReleases).where(eq(managedReleases.templateId, templateId))
        await db.delete(templates).where(eq(templates.id, templateId))
        await db.delete(user).where(eq(user.id, userId))
      }
    })

    it("publishes and resolves exact archive bytes through an injected private store", async () => {
      const suffix = randomUUID()
      const userId = `managed-publisher-${suffix}`
      const templateId = randomUUID()
      const slug = `release-${suffix.slice(0, 8)}`
      const root = await mkdtemp(join(tmpdir(), "managed-release-api-"))
      const objects = new Map<string, Uint8Array>()
      const fakeStore: ObjectStorage = {
        async copyObject() {},
        async createDownloadUrl({ key }) { return `https://private.invalid/${key}` },
        async createUploadUrl({ key }) { return `fake://staging/${key}` },
        async deleteObject(key) { objects.delete(key) },
        async getObject(key) { const bytes = objects.get(key); return { body: bytes ? Readable.from([Buffer.from(bytes)]) : undefined, contentLength: bytes?.byteLength } },
        async headObject(key) { const bytes = objects.get(key); return { contentLength: bytes?.byteLength } },
        async putObject({ key, body }) { objects.set(key, typeof body === "string" ? new TextEncoder().encode(body) : body instanceof Uint8Array ? new Uint8Array(body) : new Uint8Array()) },
      }
      const context = { headers: new Headers(), user: { id: userId, role: "admin" }, session: { activeOrganizationId: null }, requestId: "managed-release-e2e" } as never
      try {
        await db.insert(user).values({ id: userId, name: userId, email: `${userId}@example.test`, emailVerified: true, role: "admin" })
        await db.insert(templates).values({ id: templateId, slug, ownerType: "platform", name: slug, owner: "fixture", repo: slug, category: "saas" })
        const descriptor = {
          $schema: "https://app.deessejs.com/schema/template/v1.json", formatVersion: 1, name: slug, title: slug,
          description: "API archive publication fixture", type: "template:starter", version: "1.0.0", excludes: [],
        }
        await writeFile(join(root, "deesse-template.json"), JSON.stringify(descriptor))
        await writeFile(join(root, "README.md"), "fixture bytes")
        const chunks: Buffer[] = []
        for await (const chunk of c({ cwd: root, gzip: true, portable: true, mtime: new Date(0) }, ["deesse-template.json", "README.md"])) chunks.push(Buffer.from(chunk))
        const archive = new Uint8Array(Buffer.concat(chunks))
        const digest = createHash("sha256").update(archive).digest("hex")
        setManagedReleaseStorageForTests({ staging: fakeStore, sealed: fakeStore })
        const beginInput = { kind: "template" as const, slug, destination: "deessejs", version: "1.0.0", digest, descriptorDigest: createHash("sha256").update(JSON.stringify(descriptor)).digest("hex"), archiveSize: archive.byteLength, idempotencyKey: randomUUID() }
        const [attempt, duplicate] = await Promise.all([
          call(appRouter.managedReleases.begin, beginInput, { context }),
          call(appRouter.managedReleases.begin, beginInput, { context }),
        ])
        expect(attempt.alreadyPublished).toBe(false)
        expect(duplicate.uploadId).toBe(attempt.uploadId)
        const concurrentAttempt = await call(appRouter.managedReleases.begin, { ...beginInput, idempotencyKey: randomUUID() }, { context })
        const stagedKey = attempt.uploadUrl.replace("fake://staging/", "")
        objects.set(stagedKey, archive)
        const concurrentStagedKey = concurrentAttempt.uploadUrl.replace("fake://staging/", "")
        objects.set(concurrentStagedKey, archive)
        const results = await Promise.allSettled([
          call(appRouter.managedReleases.finalize, { uploadId: attempt.uploadId }, { context }),
          call(appRouter.managedReleases.finalize, { uploadId: concurrentAttempt.uploadId }, { context }),
        ])
        const publishedResult = results.find((result) => result.status === "fulfilled")
        if (!publishedResult || publishedResult.status !== "fulfilled") throw new Error("A concurrent release finalize should publish one immutable version.")
        expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1)
        expect(results.filter((result) => result.status === "rejected")).toHaveLength(1)
        const published = publishedResult.value
        expect(published.release.digest).toBe(digest)
        expect([stagedKey, concurrentStagedKey].filter((key) => objects.has(key))).toHaveLength(1)
        const resolved = await call(appRouter.managedReleases.resolve, { kind: "template", slug }, { context: { ...context, user: null, session: null } })
        expect(resolved.release?.version).toBe("1.0.0")
        expect(resolved.release?.downloadUrl).toContain("managed-releases/sealed/template/platform/deessejs/")
        const retry = await call(appRouter.managedReleases.begin, { ...beginInput, idempotencyKey: randomUUID() }, { context })
        expect(retry.alreadyPublished).toBe(true)
        const idempotentRetry = await call(appRouter.managedReleases.begin, beginInput, { context })
        expect(idempotentRetry.alreadyPublished).toBe(true)
        await expect(call(appRouter.managedReleases.begin, { ...beginInput, digest: "f".repeat(64), idempotencyKey: randomUUID() }, { context })).rejects.toMatchObject({ code: "CONFLICT" })
      } finally {
        setManagedReleaseStorageForTests(undefined)
        await rm(root, { recursive: true, force: true })
        await db.delete(managedReleases).where(eq(managedReleases.templateId, templateId))
        await db.delete(templates).where(eq(templates.id, templateId))
        await db.delete(user).where(eq(user.id, userId))
      }
    })

    it("keeps organization releases private and requires membership plus an assigned paid seat", async () => {
      const suffix = randomUUID()
      const orgId = `managed-org-${suffix}`
      const orgSlug = `managed-org-${suffix.slice(0, 8)}`
      const memberId = `managed-member-${suffix}`
      const noSeatUserId = `managed-no-seat-${suffix}`
      const outsiderId = `managed-outsider-${suffix}`
      const memberRowId = `managed-membership-${suffix}`
      const noSeatMemberRowId = `managed-no-seat-membership-${suffix}`
      const templateId = randomUUID()
      const releaseId = randomUUID()
      const blockId = randomUUID()
      const blockReleaseId = randomUUID()
      const slug = `private-${suffix.slice(0, 8)}`
      const blockSlug = `private-block-${suffix.slice(0, 8)}`
      const contextFor = (id: string) => ({ headers: new Headers(), user: { id }, session: { activeOrganizationId: orgId }, requestId: "managed-private-test" }) as never
      await db.insert(user).values([
        { id: memberId, name: memberId, email: `${memberId}@example.test`, emailVerified: true },
        { id: noSeatUserId, name: noSeatUserId, email: `${noSeatUserId}@example.test`, emailVerified: true },
        { id: outsiderId, name: outsiderId, email: `${outsiderId}@example.test`, emailVerified: true },
      ])
      await db.insert(organization).values({ id: orgId, name: orgSlug, slug: orgSlug, createdAt: new Date() })
      await db.insert(member).values([
        { id: memberRowId, organizationId: orgId, userId: memberId, role: "owner", createdAt: new Date() },
        { id: noSeatMemberRowId, organizationId: orgId, userId: noSeatUserId, role: "owner", createdAt: new Date() },
      ])
      await db.insert(subscription).values({ id: `managed-sub-${suffix}`, plan: "pro", billingInterval: "month", referenceId: orgId, status: "active", seats: 1 })
      await db.insert(organizationProSeat).values({ id: `managed-seat-${suffix}`, organizationId: orgId, memberId: memberRowId })
      await db.insert(templates).values({ id: templateId, slug, ownerType: "organization", organizationId: orgId, name: slug, owner: "fixture", repo: slug, category: "saas" })
      await db.insert(managedReleases).values({ id: releaseId, kind: "template", ownerType: "organization", organizationId: orgId, templateId, slug, version: "1.0.0", archiveKey: `private/${suffix}`, digest: "a".repeat(64), descriptorDigest: "b".repeat(64), archiveSize: 10, publishedBy: memberId })
      await db.insert(blockPublications).values({ id: blockId, organizationId: orgId, organizationSlug: orgSlug, submittedBy: memberId, slug: blockSlug, name: blockSlug, category: "ui", repositoryUrl: "https://github.com/example/private-block", sourceCommit: "a".repeat(40), descriptor: "{}", reviewStatus: "draft", publicationState: "private" })
      await db.insert(managedReleases).values({ id: blockReleaseId, kind: "block", ownerType: "organization", organizationId: orgId, blockPublicationId: blockId, slug: blockSlug, version: "1.0.0", archiveKey: `private-block/${suffix}`, digest: "c".repeat(64), descriptorDigest: "d".repeat(64), archiveSize: 10, publishedBy: memberId })
      setManagedReleaseStorageForTests({ staging: fakeStore, sealed: fakeStore })
      try {
        const input = { kind: "template" as const, slug, organizationSlug: orgSlug }
        await expect(call(appRouter.managedReleases.resolve, input, { context: contextFor(outsiderId) })).rejects.toMatchObject({ code: "NOT_FOUND" })
        await expect(call(appRouter.managedReleases.resolve, input, { context: contextFor(noSeatUserId) })).rejects.toMatchObject({ code: "FORBIDDEN" })
        const result = await call(appRouter.managedReleases.resolve, input, { context: contextFor(memberId) })
        expect(result.release?.downloadUrl).toContain(`private/${suffix}`)
        const blockInput = { kind: "block" as const, slug: blockSlug, organizationSlug: orgSlug }
        const resolvedBlock = await call(appRouter.managedReleases.resolve, blockInput, { context: contextFor(memberId) })
        expect(resolvedBlock.release?.downloadUrl).toContain(`private-block/${suffix}`)
        expect(resolvedBlock.requiresManaged).toBe(true)
        await expect(call(appRouter.managedReleases.resolve, blockInput, { context: contextFor(outsiderId) })).rejects.toMatchObject({ code: "NOT_FOUND" })
        await expect(call(appRouter.managedReleases.resolve, blockInput, { context: contextFor(noSeatUserId) })).rejects.toMatchObject({ code: "FORBIDDEN" })
        const upload = await call(appRouter.managedReleases.begin, { kind: "block", slug: blockSlug, destination: orgSlug, version: "1.1.0", digest: "e".repeat(64), descriptorDigest: "f".repeat(64), archiveSize: 10, idempotencyKey: randomUUID() }, { context: contextFor(memberId) })
        expect(upload.alreadyPublished).toBe(false)
        await expect(call(appRouter.managedReleases.begin, { kind: "block", slug: blockSlug, destination: orgSlug, version: "1.1.0", digest: "e".repeat(64), descriptorDigest: "f".repeat(64), archiveSize: 10, idempotencyKey: randomUUID() }, { context: contextFor(outsiderId) })).rejects.toMatchObject({ code: "NOT_FOUND" })
        await expect(call(appRouter.managedReleases.begin, { kind: "block", slug: blockSlug, destination: orgSlug, version: "1.1.0", digest: "e".repeat(64), descriptorDigest: "f".repeat(64), archiveSize: 10, idempotencyKey: randomUUID() }, { context: contextFor(noSeatUserId) })).rejects.toMatchObject({ code: "FORBIDDEN" })
        const anonymousList = await call(appRouter.managedReleases.list, {}, { context: { headers: new Headers(), user: null, session: null, requestId: "managed-private-list" } as never })
        expect(anonymousList.releases.some((release) => release.slug === slug)).toBe(false)
      } finally {
        setManagedReleaseStorageForTests(undefined)
        await db.delete(managedReleases).where(eq(managedReleases.id, releaseId))
        await db.delete(managedReleases).where(eq(managedReleases.id, blockReleaseId))
        await db.delete(blockPublications).where(eq(blockPublications.id, blockId))
        await db.delete(templates).where(eq(templates.id, templateId))
        await db.delete(organizationProSeat).where(eq(organizationProSeat.organizationId, orgId))
        await db.delete(member).where(eq(member.organizationId, orgId))
        await db.delete(subscription).where(eq(subscription.referenceId, orgId))
        await db.delete(organization).where(eq(organization.id, orgId))
        await db.delete(user).where(eq(user.id, memberId))
        await db.delete(user).where(eq(user.id, noSeatUserId))
        await db.delete(user).where(eq(user.id, outsiderId))
      }
    })

    it("fails closed for paid platform templates when no active Pro seat exists", async () => {
      const suffix = randomUUID()
      const userId = `managed-free-user-${suffix}`
      const templateId = randomUUID()
      const slug = `protected-${suffix.slice(0, 8)}`
      await db.insert(user).values({ id: userId, name: userId, email: `${userId}@example.test`, emailVerified: true })
      await db.insert(templates).values({ id: templateId, slug, ownerType: "platform", name: slug, owner: "deessejs", repo: slug, category: "saas", access: "paid" })
      const context = { headers: new Headers(), user: { id: userId }, session: { activeOrganizationId: null }, requestId: "managed-protected-test" } as never
      try {
        await expect(call(appRouter.managedReleases.resolve, { kind: "template", slug }, { context })).rejects.toMatchObject({ code: "FORBIDDEN" })
      } finally {
        await db.delete(templates).where(eq(templates.id, templateId))
        await db.delete(user).where(eq(user.id, userId))
      }
    })
  }
})
