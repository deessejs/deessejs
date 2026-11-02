import { createHmac, randomUUID } from "node:crypto"
import { Readable } from "node:stream"
import { eq, inArray } from "drizzle-orm"
import sharp from "sharp"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { inject } from "vitest"

import { auth } from "@workspace/auth"
import { db } from "@workspace/database"
import {
  member,
  organization,
  session,
  storageObjects,
  storageUploads,
  user,
  userAvatars,
} from "@workspace/database/schema"
import { api } from "../../../src/index.js"
import { findOrganizationForMember } from "../../../src/core/organization/membership.js"
import { getAvatarStorage } from "../../../src/core/avatars/storage.js"

const POSTGRES_READY = inject("postgres:ready") === true
const SESSION_COOKIE_NAME = "better-auth.session_token"

const storageFake = vi.hoisted(() => {
  const objects = new Map<string, Buffer>()
  return {
    objects,
    failPut: false,
    reset() {
      objects.clear()
      this.failPut = false
    },
    createAvatarKeys() {
      const id = randomUUID()
      return {
        stagedKey: `test/staged/${id}`,
        objectKey: `test/final/${id}`,
      }
    },
    storage: {
      async createUploadUrl({ key }: { key: string }) {
        return `https://storage.test/upload/${encodeURIComponent(key)}`
      },
      async headObject(key: string) {
        const body = objects.get(key)
        if (!body) throw new Error("Object not found")
        return { contentLength: body.byteLength, contentType: "image/png" }
      },
      async getObject(key: string) {
        const body = objects.get(key)
        if (!body) throw new Error("Object not found")
        return {
          body: Readable.from([body]),
          contentLength: body.byteLength,
          contentType: "image/png",
        }
      },
      async putObject({ key, body }: { key: string; body: Buffer }) {
        if (storageFake.failPut) throw new Error("Injected storage failure")
        objects.set(key, Buffer.from(body))
      },
      async deleteObject(key: string) {
        objects.delete(key)
      },
    },
  }
})

vi.mock("../../../src/core/avatars/storage.js", () => ({
  createAvatarKeys: storageFake.createAvatarKeys,
  getAvatarStorage: () => storageFake.storage,
}))

let fixtureNumber = 0
const uniqueId = (prefix: string) =>
  `${prefix}-${randomUUID().slice(0, 8)}-${fixtureNumber++}`
const createdUsers: string[] = []
const createdOrganizations: string[] = []

const authSecret = async () => (await auth.$context).options.secret
const cookieFor = async (token: string) => {
  const signature = createHmac("sha256", await authSecret())
    .update(token)
    .digest("base64")
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(`${token}.${signature}`)}`
}

type Actor = { id: string; cookie: string }
const createActor = async (): Promise<Actor> => {
  const id = uniqueId("avatar-user")
  await db.insert(user).values({
    id,
    name: id,
    email: `${id}@example.com`,
    emailVerified: true,
  })
  createdUsers.push(id)
  const token = uniqueId("avatar-token")
  await db.insert(session).values({
    id: uniqueId("avatar-session"),
    token,
    userId: id,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  })
  return { id, cookie: await cookieFor(token) }
}

type TestOrganization = { id: string; slug: string }
const createOrganization = async (): Promise<TestOrganization> => {
  const id = uniqueId("avatar-org")
  const slug = uniqueId("avatar-org-slug")
  await db.insert(organization).values({ id, name: id, slug, createdAt: new Date() })
  createdOrganizations.push(id)
  return { id, slug }
}

const addMember = async (orgId: string, userId: string, role: string) => {
  await db.insert(member).values({
    id: uniqueId("avatar-member"),
    organizationId: orgId,
    userId,
    role,
    createdAt: new Date(),
  })
}

type RpcResult = { status: number; body: Record<string, unknown> }
const rpc = async (path: string[], data: unknown, cookie?: string): Promise<RpcResult> => {
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (cookie) headers.cookie = cookie
  const response = await api.request(`/api/v1/rpc/${path.join("/")}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ json: data }),
  })
  return { status: response.status, body: (await response.json()) as Record<string, unknown> }
}

const lastPathSegment = (value: string) => {
  const segment = value.split("/").at(-1)
  if (!segment) throw new Error("Expected a URL path segment")
  return segment
}

const createdAvatar = async (actor: Actor, organizationSlug?: string) => {
  const path = organizationSlug
    ? ["organization", "avatar", "createUpload"]
    : ["profile", "avatar", "createUpload"]
  const input = organizationSlug
    ? { slug: organizationSlug, contentType: "image/png", byteSize: png.byteLength }
    : { contentType: "image/png", byteSize: png.byteLength }
  const upload = await rpc(path, input, actor.cookie)
  expect(upload.status, JSON.stringify(upload.body)).toBe(200)
  const payload = upload.body.json as { uploadId: string; uploadUrl: string }
  const key = decodeURIComponent(lastPathSegment(payload.uploadUrl))
  storageFake.objects.set(key, png)
  const completePath = organizationSlug
    ? ["organization", "avatar", "complete"]
    : ["profile", "avatar", "complete"]
  const completionInput = organizationSlug
    ? { slug: organizationSlug, uploadId: payload.uploadId }
    : { uploadId: payload.uploadId }
  const completed = await rpc(completePath, completionInput, actor.cookie)
  expect(completed.status).toBe(200)
  return completed.body.json as { imageUrl: string }
}

const png = await sharp({
  create: { width: 2, height: 2, channels: 4, background: { r: 40, g: 80, b: 120, alpha: 1 } },
}).png().toBuffer()

afterEach(async () => {
  storageFake.reset()
  const users = createdUsers.splice(0)
  const organizations = createdOrganizations.splice(0)
  if (users.length > 0) {
    const linkedOrganizations = await db
      .select({ id: organization.id })
      .from(organization)
      .innerJoin(member, eq(member.organizationId, organization.id))
      .where(inArray(member.userId, users))
    for (const row of linkedOrganizations) organizations.push(row.id)
    await db.delete(user).where(inArray(user.id, users))
  }
  if (organizations.length > 0) {
    await db.delete(organization).where(inArray(organization.id, organizations))
  }
})

describe.skipIf(!POSTGRES_READY)("avatar API integration", () => {
  beforeEach(() => {
    expect(getAvatarStorage()).toBe(storageFake.storage)
  })
  it("rejects unauthenticated requests and hides avatars from unrelated users", async () => {
    const owner = await createActor()
    const stranger = await createActor()
    const unauthenticated = await rpc(["profile", "avatar", "get"], null)
    expect(unauthenticated.status).toBe(401)

    const pendingUpload = await rpc(
      ["profile", "avatar", "createUpload"],
      { contentType: "image/png", byteSize: png.byteLength },
      owner.cookie
    )
    const pendingUploadId = (pendingUpload.body.json as { uploadId: string }).uploadId
    const crossUserComplete = await rpc(
      ["profile", "avatar", "complete"],
      { uploadId: pendingUploadId },
      stranger.cookie
    )
    expect(crossUserComplete.status).toBe(404)

    const avatar = await createdAvatar(owner)
    const objectId = lastPathSegment(avatar.imageUrl)
    const hidden = await api.request(avatar.imageUrl, {
      headers: { cookie: stranger.cookie },
    })
    expect(hidden.status).toBe(404)

    const shown = await api.request(avatar.imageUrl, {
      headers: { cookie: owner.cookie },
    })
    expect(shown.status).toBe(200)
    expect(shown.headers.get("content-type")).toBe("image/webp")

    const removed = await rpc(["profile", "avatar", "remove"], null, owner.cookie)
    expect(removed.status).toBe(200)
    const afterRemove = await rpc(["profile", "avatar", "get"], null, owner.cookie)
    expect((afterRemove.body.json as { imageUrl: string | null }).imageUrl).toBeNull()

    const otherUserGet = await rpc(["profile", "avatar", "get"], null, stranger.cookie)
    expect(otherUserGet.status).toBe(200)
    expect((otherUserGet.body.json as { imageUrl: string | null }).imageUrl).toBeNull()
    expect(objectId).toMatch(/^[0-9a-f-]{36}$/i)
  })

  it("allows member image reads and managing-role organization updates, while denying cross-organization operations", async () => {
    const owner = await createActor()
    const viewer = await createActor()
    const admin = await createActor()
    const outsider = await createActor()
    const org = await createOrganization()
    const otherOrg = await createOrganization()
    await addMember(org.id, owner.id, "owner")
    await addMember(org.id, viewer.id, "member")
    await addMember(org.id, admin.id, "admin")
    await addMember(otherOrg.id, outsider.id, "owner")
    const memberships = await db
      .select({ organizationId: member.organizationId, role: member.role })
      .from(member)
      .where(eq(member.userId, owner.id))
    expect(memberships).toEqual([{ organizationId: org.id, role: "owner" }])
    expect(await findOrganizationForMember(owner.id, org.slug)).toMatchObject({
      id: org.id,
      role: "owner",
    })

    const deniedUpload = await rpc(
      ["organization", "avatar", "createUpload"],
      { slug: org.slug, contentType: "image/png", byteSize: png.byteLength },
      viewer.cookie
    )
    expect(deniedUpload.status).toBe(403)

    const avatar = await createdAvatar(owner, org.slug)
    const adminAvatar = await createdAvatar(admin, org.slug)
    expect(adminAvatar.imageUrl).not.toBe(avatar.imageUrl)
    const memberRead = await rpc(["organization", "avatar", "get"], { slug: org.slug }, viewer.cookie)
    expect(memberRead.status).toBe(200)
    expect((memberRead.body.json as { imageUrl: string }).imageUrl).toBe(adminAvatar.imageUrl)

    const crossOrg = await rpc(["organization", "avatar", "get"], { slug: org.slug }, outsider.cookie)
    expect(crossOrg.status).toBe(403)
    const outsiderImage = await api.request(adminAvatar.imageUrl, { headers: { cookie: outsider.cookie } })
    expect(outsiderImage.status).toBe(404)

    const removed = await rpc(
      ["organization", "avatar", "remove"],
      { slug: org.slug },
      admin.cookie
    )
    expect(removed.status).toBe(200)
  })

  it("persists a promoted upload and serves its image, but leaves no ready avatar after storage failure", async () => {
    const actor = await createActor()
    const avatar = await createdAvatar(actor)
    const read = await api.request(avatar.imageUrl, { headers: { cookie: actor.cookie } })
    expect(read.status).toBe(200)

    const failingActor = await createActor()
    const upload = await rpc(
      ["profile", "avatar", "createUpload"],
      { contentType: "image/png", byteSize: png.byteLength },
      failingActor.cookie
    )
    expect(upload.status).toBe(200)
    const { uploadId, uploadUrl } = upload.body.json as { uploadId: string; uploadUrl: string }
    storageFake.objects.set(decodeURIComponent(lastPathSegment(uploadUrl)), png)
    storageFake.failPut = true
    const failed = await rpc(["profile", "avatar", "complete"], { uploadId }, failingActor.cookie)
    expect(failed.status).toBe(500)

    const [uploadRow] = await db.select().from(storageUploads).where(eq(storageUploads.id, uploadId))
    const [objectRow] = await db.select().from(storageObjects).where(eq(storageObjects.id, uploadRow.objectId))
    const [avatarRow] = await db.select().from(userAvatars).where(eq(userAvatars.userId, failingActor.id))
    expect(uploadRow.state).toBe("delete_pending")
    expect(objectRow.state).toBe("delete_pending")
    expect(avatarRow).toBeUndefined()
  })
})
