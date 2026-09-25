/**
 * Contract tests run against the R2 adapter with an in-memory
 * mock of the S3Client.
 *
 * The mock maintains a Map<string, Uint8Array> as the "bucket" and
 * responds to every SDK command the adapter might send. This lets
 * the same contract suite that runs against LocalFsObjectStore run
 * against R2ObjectStore, catching any drift between the two
 * providers.
 *
 * The actual `it(...)` blocks are registered by
 * `runObjectStoreContractTests` at the bottom of this file.
 */
/* eslint-disable @typescript-eslint/no-this-alias */

import { describe, expect, it } from "vitest"
import { Readable } from "node:stream"

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
  type _Object,
} from "@aws-sdk/client-s3"

import { createR2ObjectStore } from "../src/providers/r2.js"
import { runObjectStoreContractTests } from "./object-store.contract.js"

// The bulk of this file's tests are emitted programmatically by
// `runObjectStoreContractTests` at the bottom. To keep ESLint
// happy and make the suite's intent obvious to humans, this
// describe block asserts the in-memory mock actually behaves as a
// fake bucket.
describe("R2 contract — in-memory mock sanity", () => {
  it("the mock bucket accepts a put then returns the bytes on get", async () => {
    const { client } = new InMemoryBucket().toClient()
    const store = createR2ObjectStore({
      accountId: "fake",
      bucket: "test",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
      client,
    })
    await store.put("hello.txt", new TextEncoder().encode("hi"))
    const body = await store.get("hello.txt")
    expect(body).not.toBeNull()
    expect(await new Response(body!).text()).toBe("hi")
  })
})

/**
 * In-memory "bucket" backed by a Map. The mock S3Client is wired
 * to respond to each SDK command against this state.
 */
class InMemoryBucket {
  private readonly objects = new Map<string, { bytes: Uint8Array; contentType?: string }>()

  /** Build an S3Client whose `send` reads/writes this bucket. */
  toClient(): { client: S3Client; bucket: InMemoryBucket } {
    const bucket = this
    const client = new S3Client({
      region: "auto",
      endpoint: "https://fake.r2.cloudflarestorage.com",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
    })
    client.send = async (command) => {
      if (command instanceof PutObjectCommand) {
        const key = (command.input.Key ?? "") as string
        const body = command.input.Body
        if (body === undefined) {
          throw s3Error("InvalidArgument", 400)
        }
        if (body instanceof Uint8Array) {
          bucket.objects.set(key, { bytes: body })
        } else if (body instanceof Readable) {
          const chunks: Buffer[] = []
          for await (const chunk of body) {
            chunks.push(chunk as Buffer)
          }
          bucket.objects.set(key, { bytes: new Uint8Array(Buffer.concat(chunks)) })
        } else {
          throw s3Error("InvalidArgument", 400)
        }
        return {} as never
      }
      if (command instanceof GetObjectCommand) {
        const key = command.input.Key ?? ""
        const obj = bucket.objects.get(key)
        if (!obj) throw s3Error("NoSuchKey", 404)
        return {
          Body: Readable.from(Buffer.from(obj.bytes)),
          ContentLength: obj.bytes.length,
          ContentType: obj.contentType,
          ETag: `"${stableEtag(obj.bytes)}"`,
        } as never
      }
      if (command instanceof HeadObjectCommand) {
        const key = command.input.Key ?? ""
        const obj = bucket.objects.get(key)
        if (!obj) throw s3Error("NoSuchKey", 404)
        return {
          ContentLength: obj.bytes.length,
          ContentType: obj.contentType,
          ETag: `"${stableEtag(obj.bytes)}"`,
          LastModified: new Date(),
        } as never
      }
      if (command instanceof DeleteObjectCommand) {
        const key = command.input.Key ?? ""
        bucket.objects.delete(key) // idempotent — no throw if absent
        return {} as never
      }
      if (command instanceof ListObjectsV2Command) {
        const prefix = command.input.Prefix ?? ""
        const matches: _Object[] = []
        for (const [key, obj] of bucket.objects) {
          if (!key.startsWith(prefix)) continue
          matches.push({
            Key: key,
            Size: obj.bytes.length,
            ETag: `"${stableEtag(obj.bytes)}"`,
            LastModified: new Date(),
          })
        }
        matches.sort((a, b) => (a.Key! < b.Key! ? -1 : 1))
        return {
          Contents: matches,
          KeyCount: matches.length,
          IsTruncated: false,
        } as never
      }
      throw s3Error("InvalidArgument", 400, `Unknown command: ${command.constructor.name}`)
    }
    return { client, bucket }
  }
}

function s3Error(name: string, status: number, message = name): S3ServiceException {
  const err = new S3ServiceException({ name, message })
  Object.assign(err, { $metadata: { httpStatusCode: status } })
  return err
}

/** Deterministic, content-derived ETag. Not MD5; just stable for tests. */
function stableEtag(bytes: Uint8Array): string {
  let h = 0
  for (let i = 0; i < bytes.length; i++) {
    h = (h * 31 + (bytes[i] ?? 0)) >>> 0
  }
  return h.toString(16).padStart(8, "0")
}

runObjectStoreContractTests("r2 (in-memory mock)", {
  makeStore: () => {
    const { client } = new InMemoryBucket().toClient()
    return createR2ObjectStore({
      accountId: "fake",
      bucket: "test",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
      client,
    })
  },
})
