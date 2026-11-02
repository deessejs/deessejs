import { createHmac, randomUUID } from "node:crypto"
import { serve } from "@hono/node-server"
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { inArray } from "drizzle-orm"
import sharp from "sharp"
import { afterAll, beforeAll, describe, expect, it, inject } from "vitest"

import { auth } from "@workspace/auth"
import { db } from "@workspace/database"
import { session, storageObjects, user } from "@workspace/database/schema"

const POSTGRES_READY = inject("postgres:ready") === true
const endpoint = process.env.R2_ENDPOINT
const bucket = process.env.R2_AVATARS_BUCKET
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const region = process.env.R2_REGION ?? "us-east-1"
const users: string[] = []
let apiUrl = ""
let server: ReturnType<typeof serve> | undefined

const s3 = () => {
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("MinIO credentials and endpoint are required")
  }
  return new S3Client({
    endpoint,
    region,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  })
}

const cookieFor = async (token: string) => {
  const signature = createHmac("sha256", (await auth.$context).options.secret)
    .update(token)
    .digest("base64")
  return `better-auth.session_token=${encodeURIComponent(`${token}.${signature}`)}`
}

describe("avatar HTTP E2E with PostgreSQL and MinIO", () => {
  beforeAll(async () => {
    if (!POSTGRES_READY)
      throw new Error(
        "PostgreSQL is required for avatar E2E (postgres:ready=false)"
      )
    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "MinIO E2E requires R2_ENDPOINT, R2_AVATARS_BUCKET, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY"
      )
    }
    const readyUntil = Date.now() + 30_000
    let minioReady = false
    while (Date.now() < readyUntil) {
      try {
        const response = await fetch(`${endpoint}/minio/health/ready`)
        if (response.ok) {
          minioReady = true
          break
        }
      } catch {
        // The service container may still be starting.
      }
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    if (!minioReady) throw new Error(`MinIO readiness failed at ${endpoint}`)
    const client = s3()
    await client
      .send(new CreateBucketCommand({ Bucket: bucket }))
      .catch((error: unknown) => {
        if (
          !(error instanceof Error) ||
          !["BucketAlreadyOwnedByYou", "BucketAlreadyExists"].includes(
            error.name
          )
        )
          throw error
      })
    const { api } = await import("../../src/index.js")
    const address = await new Promise<{ port: number }>((resolve, reject) => {
      server = serve(
        { fetch: api.fetch, hostname: "127.0.0.1", port: 0 },
        resolve
      )
      server.once("error", reject)
    })
    apiUrl = `http://127.0.0.1:${address.port}`
    const health = await fetch(`${apiUrl}/api/v1/health`)
    if (!health.ok)
      throw new Error(`API HTTP readiness failed: ${health.status}`)
    console.info(
      `[avatar-e2e] API HTTP ${apiUrl}; MinIO ${endpoint}/${bucket}; PostgreSQL ready`
    )
  }, 30_000)

  afterAll(async () => {
    const ids = users.splice(0)
    if (ids.length) {
      const objects = await db
        .select()
        .from(storageObjects)
        .where(inArray(storageObjects.createdByUserId, ids))
      const client = s3()
      for (const object of objects) {
        await client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: object.objectKey })
        )
      }
      await db.delete(user).where(inArray(user.id, ids))
      if (objects.length)
        await db.delete(storageObjects).where(
          inArray(
            storageObjects.id,
            objects.map(({ id }) => id)
          )
        )
    }
    const runningServer = server
    if (runningServer)
      await new Promise<void>((resolve, reject) =>
        runningServer.close((error) => (error ? reject(error) : resolve()))
      )
    if (endpoint && accessKeyId && secretAccessKey) s3().destroy()
  })

  it("uploads through MinIO's presigned URL, confirms, reads, replaces, and removes the avatar", async () => {
    const id = `avatar-e2e-${randomUUID()}`
    const token = `avatar-session-${randomUUID()}`
    await db.insert(user).values({
      id,
      name: id,
      email: `${id}@example.test`,
      emailVerified: true,
    })
    users.push(id)
    await db.insert(session).values({
      id: randomUUID(),
      token,
      userId: id,
      expiresAt: new Date(Date.now() + 3_600_000),
    })
    const cookie = await cookieFor(token)
    const png = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 4,
        background: { r: 40, g: 80, b: 120, alpha: 1 },
      },
    })
      .png()
      .toBuffer()

    const upload = async (bytes: Buffer) => {
      const request = await fetch(
        `${apiUrl}/api/v1/rpc/profile/avatar/createUpload`,
        {
          method: "POST",
          headers: { cookie, "content-type": "application/json" },
          body: JSON.stringify({
            json: { contentType: "image/png", byteSize: bytes.byteLength },
          }),
        }
      )
      expect(request.status).toBe(200)
      const { uploadId, uploadUrl } = (
        (await request.json()) as {
          json: { uploadId: string; uploadUrl: string }
        }
      ).json
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": "image/png" },
        body: bytes,
      })
      console.info(`[avatar-e2e] MinIO presigned PUT ${put.status}`)
      expect(put.ok, `MinIO presigned PUT returned ${put.status}`).toBe(true)
      const confirm = await fetch(
        `${apiUrl}/api/v1/rpc/profile/avatar/complete`,
        {
          method: "POST",
          headers: { cookie, "content-type": "application/json" },
          body: JSON.stringify({ json: { uploadId } }),
        }
      )
      expect(confirm.status).toBe(200)
      return ((await confirm.json()) as { json: { imageUrl: string } }).json
        .imageUrl
    }

    const firstUrl = await upload(png)
    const firstImage = await fetch(new URL(firstUrl, apiUrl), {
      headers: { cookie },
    })
    expect(firstImage.status).toBe(200)
    expect(firstImage.headers.get("content-type")).toBe("image/webp")
    const firstBytes = Buffer.from(await firstImage.arrayBuffer())
    expect(firstBytes.subarray(0, 4).toString()).toBe("RIFF")

    const strangerId = `avatar-e2e-stranger-${randomUUID()}`
    await db.insert(user).values({
      id: strangerId,
      name: strangerId,
      email: `${strangerId}@example.test`,
      emailVerified: true,
    })
    users.push(strangerId)
    const strangerToken = `avatar-stranger-session-${randomUUID()}`
    await db.insert(session).values({
      id: randomUUID(),
      token: strangerToken,
      userId: strangerId,
      expiresAt: new Date(Date.now() + 3_600_000),
    })
    const strangerResponse = await fetch(new URL(firstUrl, apiUrl), {
      headers: { cookie: await cookieFor(strangerToken) },
    })
    expect(strangerResponse.status).toBe(404)

    const replacementUrl = await upload(png)
    expect(replacementUrl).not.toBe(firstUrl)
    expect(
      (await fetch(new URL(firstUrl, apiUrl), { headers: { cookie } })).status
    ).toBe(404)
    expect(
      (await fetch(new URL(replacementUrl, apiUrl), { headers: { cookie } }))
        .status
    ).toBe(200)

    const removed = await fetch(`${apiUrl}/api/v1/rpc/profile/avatar/remove`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ json: null }),
    })
    expect(removed.status).toBe(200)
    expect(
      (await fetch(new URL(replacementUrl, apiUrl), { headers: { cookie } }))
        .status
    ).toBe(404)
  }, 60_000)
})
