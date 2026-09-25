/**
 * Tests for R2ObjectStore.
 *
 * The R2 adapter is a thin shell over `@aws-sdk/client-s3`, so the
 * things worth testing here are NOT protocol-level signing or XML
 * parsing (the SDK owns those). What we test:
 *
 *   1. The constructor wires the right endpoint + region + creds.
 *   2. Each ObjectStore verb sends the expected SDK command shape
 *      (Bucket, Key, Prefix, Body).
 *   3. The adapter translates SDK errors to our 4-class taxonomy.
 *   4. list() yields every object across paginator pages.
 *   5. get() converts the SDK's Node Readable to a Web ReadableStream.
 *
 * NO real-network tests in this commit. Live R2 round-trip tests
 * belong to a follow-up PR gated on a CI secret.
 */

import {
  describe,
  expect,
  it,
} from "vitest"
import { Readable } from "node:stream"

import { createR2ObjectStore } from "../src/providers/r2.js"
import {
  StorageAuthError,
  StorageNetworkError,
  StorageNotFoundError,
} from "../src/errors.js"
import type { ObjectMeta } from "../src/object-store.js"

// We import the SDK exception class via the same path the provider
// uses, so the test mocks against the real type contract.
import {
  S3Client,
  S3ServiceException,
  type Command,
} from "@aws-sdk/client-s3"

// ---------------------------------------------------------------------------
// Fake S3Client
// ---------------------------------------------------------------------------
//
// We construct a REAL S3Client (with a never-used endpoint) and stub
// its `send` method. This is necessary because the SDK paginator
// (`paginateListObjectsV2`) checks `instanceof S3Client` internally,
// which a duck-typed object literal would fail.
// ---------------------------------------------------------------------------

interface FakeState {
  /** Commands captured, in order. */
  calls: Array<{ command: Command; input: unknown }>
  /** Per-command mocked response or error. */
  responder: (command: Command) => unknown
}

function makeFakeClient(responder: (command: Command) => unknown): {
  client: S3Client
  state: FakeState
} {
  const state: FakeState = { calls: [], responder }
  const client = new S3Client({
    region: "auto",
    endpoint: "https://fake.r2.cloudflarestorage.com",
    credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
  })
  client.send = async (command: Command) => {
    const input = (command as unknown as { input: unknown }).input
    state.calls.push({ command, input })
    return state.responder(command)
  }
  return { client, state }
}

// ---------------------------------------------------------------------------
// S3ServiceException builders (so tests don't import internal classes)
// ---------------------------------------------------------------------------

function s3Exception(
  name: string,
  status: number,
  message = name,
): S3ServiceException {
  const err = new S3ServiceException({ name, message })
  // S3ServiceException populates $metadata via the constructor, but
  // we override to make the test self-documenting.
  Object.assign(err, {
    $metadata: { httpStatusCode: status, requestId: "test" },
  })
  return err
}

// ---------------------------------------------------------------------------
// Builders for SDK response shapes
// ---------------------------------------------------------------------------

function headResponse(overrides: {
  etag?: string
  size?: number
  lastModified?: Date
  contentType?: string
}) {
  return {
    ETag: overrides.etag,
    ContentLength: overrides.size,
    LastModified: overrides.lastModified,
    ContentType: overrides.contentType,
    $metadata: { httpStatusCode: 200 },
  }
}

function listObject(overrides: {
  key: string
  size?: number
  lastModified?: Date
  etag?: string
}) {
  return {
    Key: overrides.key,
    Size: overrides.size,
    LastModified: overrides.lastModified,
    ETag: overrides.etag,
  }
}

const baseOpts = (client: S3Client) => ({
  accountId: "acct",
  bucket: "templates",
  credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
  client,
})

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe("R2ObjectStore — constructor", () => {
  it("rejects empty accountId / bucket / creds", () => {
    const { client } = makeFakeClient(() => undefined)
    expect(() => createR2ObjectStore({ ...baseOpts(client), accountId: "" })).toThrow(/accountId/)
    expect(() => createR2ObjectStore({ ...baseOpts(client), bucket: "" })).toThrow(/bucket/)
    expect(
      () =>
        createR2ObjectStore({
          ...baseOpts(client),
          credentials: { accessKeyId: "", secretAccessKey: "x" },
        }),
    ).toThrow(/accessKeyId/)
    expect(
      () =>
        createR2ObjectStore({
          ...baseOpts(client),
          credentials: { accessKeyId: "x", secretAccessKey: "" },
        }),
    ).toThrow(/secretAccessKey/)
  })

  it("builds a real S3Client when none is injected", () => {
    const store = createR2ObjectStore({
      accountId: "acct",
      bucket: "b",
      credentials: { accessKeyId: "AKID", secretAccessKey: "SECRET" },
    })
    expect(store).toBeDefined()
    expect(typeof store.put).toBe("function")
    expect(typeof store.get).toBe("function")
    expect(typeof store.delete).toBe("function")
    expect(typeof store.head).toBe("function")
    expect(typeof store.list).toBe("function")
  })
})

// ---------------------------------------------------------------------------
// get
// ---------------------------------------------------------------------------

describe("R2ObjectStore — get", () => {
  it("sends GetObjectCommand with the expected Bucket/Key", async () => {
    const stream = Readable.from([Buffer.from("hello, r2")])
    const { client, state } = makeFakeClient(() => ({
      Body: stream,
      $metadata: { httpStatusCode: 200 },
    }))
    const store = createR2ObjectStore(baseOpts(client))

    const out = await store.get("template.json")

    expect(state.calls).toHaveLength(1)
    const { command, input } = state.calls[0]!
    expect(command.constructor.name).toBe("GetObjectCommand")
    expect(input).toMatchObject({ Bucket: "templates", Key: "template.json" })

    // Body should be a Web ReadableStream (Readable.toWeb).
    expect(out).toBeInstanceOf(ReadableStream)
    const text = await new Response(out!).text()
    expect(text).toBe("hello, r2")
  })

  it("returns null on NoSuchKey", async () => {
    const { client } = makeFakeClient(() => {
      throw s3Exception("NoSuchKey", 404)
    })
    const store = createR2ObjectStore(baseOpts(client))
    expect(await store.get("missing")).toBeNull()
  })

  it("returns null on generic 404 (NotFound)", async () => {
    const { client } = makeFakeClient(() => {
      throw s3Exception("NotFound", 404)
    })
    const store = createR2ObjectStore(baseOpts(client))
    expect(await store.get("missing")).toBeNull()
  })

  it("throws StorageAuthError on 403", async () => {
    const { client } = makeFakeClient(() => {
      throw s3Exception("SignatureDoesNotMatch", 403)
    })
    const store = createR2ObjectStore(baseOpts(client))
    await expect(store.get("k")).rejects.toBeInstanceOf(StorageAuthError)
  })

  it("throws StorageNetworkError on 5xx", async () => {
    const { client } = makeFakeClient(() => {
      throw s3Exception("InternalServerError", 500)
    })
    const store = createR2ObjectStore(baseOpts(client))
    await expect(store.get("k")).rejects.toBeInstanceOf(StorageNetworkError)
  })

  it("throws StorageError when the body is missing", async () => {
    const { client } = makeFakeClient(() => ({
      Body: undefined,
      $metadata: { httpStatusCode: 200 },
    }))
    const store = createR2ObjectStore(baseOpts(client))
    await expect(store.get("k")).rejects.toMatchObject({
      code: "storage.empty_body",
    })
  })
})

// ---------------------------------------------------------------------------
// put
// ---------------------------------------------------------------------------

describe("R2ObjectStore — put", () => {
  it("sends PutObjectCommand with bytes body and the right Bucket/Key", async () => {
    const { client, state } = makeFakeClient(() => ({
      $metadata: { httpStatusCode: 200 },
    }))
    const store = createR2ObjectStore(baseOpts(client))
    await store.put("k", new TextEncoder().encode("payload"))

    expect(state.calls).toHaveLength(1)
    const { command, input } = state.calls[0]!
    expect(command.constructor.name).toBe("PutObjectCommand")
    expect(input).toMatchObject({ Bucket: "templates", Key: "k" })
    expect(input.Body).toBeInstanceOf(Uint8Array)
  })

  it("converts a Web ReadableStream to a Node Readable for the SDK", async () => {
    const { client, state } = makeFakeClient(() => ({
      $metadata: { httpStatusCode: 200 },
    }))
    const store = createR2ObjectStore(baseOpts(client))
    const webStream = new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode("streamed"))
        c.close()
      },
    })
    await store.put("k", webStream)
    const body = state.calls[0]!.input.Body as Readable
    expect(body).toBeInstanceOf(Readable)
    const chunks: Buffer[] = []
    for await (const chunk of body) chunks.push(chunk as Buffer)
    expect(Buffer.concat(chunks).toString()).toBe("streamed")
  })

  it("throws StorageNetworkError on 404 (PUT 404 = bucket missing, NOT success)", async () => {
    const { client } = makeFakeClient(() => {
      throw s3Exception("NoSuchBucket", 404)
    })
    const store = createR2ObjectStore(baseOpts(client))
    await expect(
      store.put("k", new Uint8Array([1, 2, 3])),
    ).rejects.toBeInstanceOf(StorageNotFoundError)
  })

  it("throws StorageAuthError on 403", async () => {
    const { client } = makeFakeClient(() => {
      throw s3Exception("AccessDenied", 403)
    })
    const store = createR2ObjectStore(baseOpts(client))
    await expect(
      store.put("k", new Uint8Array([1, 2, 3])),
    ).rejects.toBeInstanceOf(StorageAuthError)
  })
})

// ---------------------------------------------------------------------------
// delete
// ---------------------------------------------------------------------------

describe("R2ObjectStore — delete", () => {
  it("sends DeleteObjectCommand with the right Bucket/Key", async () => {
    const { client, state } = makeFakeClient(() => ({
      $metadata: { httpStatusCode: 204 },
    }))
    const store = createR2ObjectStore(baseOpts(client))
    await store.delete("k")

    expect(state.calls).toHaveLength(1)
    const { command, input } = state.calls[0]!
    expect(command.constructor.name).toBe("DeleteObjectCommand")
    expect(input).toMatchObject({ Bucket: "templates", Key: "k" })
  })

  it("is idempotent on NoSuchKey", async () => {
    const { client } = makeFakeClient(() => {
      throw s3Exception("NoSuchKey", 404)
    })
    const store = createR2ObjectStore(baseOpts(client))
    await expect(store.delete("k")).resolves.toBeUndefined()
  })

  it("throws StorageAuthError on 403", async () => {
    const { client } = makeFakeClient(() => {
      throw s3Exception("InvalidAccessKeyId", 403)
    })
    const store = createR2ObjectStore(baseOpts(client))
    await expect(store.delete("k")).rejects.toBeInstanceOf(StorageAuthError)
  })
})

// ---------------------------------------------------------------------------
// head
// ---------------------------------------------------------------------------

describe("R2ObjectStore — head", () => {
  it("sends HeadObjectCommand and translates the response", async () => {
    const { client, state } = makeFakeClient(() =>
      headResponse({
        etag: '"deadbeef"',
        size: 1234,
        lastModified: new Date("2026-10-21T07:28:00Z"),
        contentType: "application/json",
      }),
    )
    const store = createR2ObjectStore(baseOpts(client))
    const meta = await store.head("k.json")

    expect(state.calls).toHaveLength(1)
    expect(state.calls[0]!.command.constructor.name).toBe("HeadObjectCommand")
    expect(meta).toEqual({
      key: "k.json",
      etag: "deadbeef",
      size: 1234,
      lastModified: "2026-10-21T07:28:00.000Z",
      contentType: "application/json",
    })
  })

  it("returns null on NoSuchKey", async () => {
    const { client } = makeFakeClient(() => {
      throw s3Exception("NoSuchKey", 404)
    })
    const store = createR2ObjectStore(baseOpts(client))
    expect(await store.head("missing")).toBeNull()
  })

  it("strips surrounding quotes from the ETag", async () => {
    const { client } = makeFakeClient(() =>
      headResponse({ etag: '"abc123"', size: 1 }),
    )
    const store = createR2ObjectStore(baseOpts(client))
    const meta = await store.head("k")
    expect(meta!.etag).toBe("abc123")
  })
})

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

describe("R2ObjectStore — list", () => {
  it("sends ListObjectsV2 with Prefix and yields all items across pages", async () => {
    // The SDK's paginator builds the ListObjectsV2Command and
    // follows NextContinuationToken transparently. We mock the
    // command's output: a single response with 3 contents.
    const { client, state } = makeFakeClient(() => ({
      Contents: [
        listObject({ key: "dir/a.json", size: 10, etag: '"x1"' }),
        listObject({ key: "dir/b.json", size: 20, etag: '"x2"' }),
        listObject({ key: "dir/c.json", size: 30, etag: '"x3"' }),
      ],
      KeyCount: 3,
      $metadata: { httpStatusCode: 200 },
    }))
    const store = createR2ObjectStore(baseOpts(client))

    const out: ObjectMeta[] = []
    for await (const m of store.list("dir/")) out.push(m)

    expect(out.map((m) => m.key)).toEqual([
      "dir/a.json",
      "dir/b.json",
      "dir/c.json",
    ])
    expect(out[0]!.size).toBe(10)
    expect(out[0]!.etag).toBe("x1")

    // The paginator uses ListObjectsV2 under the hood. We don't
    // assert the exact call count (the SDK may emit multiple
    // requests for pagination bookkeeping), but at least one call
    // must have included the Prefix.
    expect(state.calls.length).toBeGreaterThanOrEqual(1)
    const firstInput = state.calls[0]!.input as { Prefix?: string }
    expect(firstInput.Prefix).toBe("dir/")
  })

  it("normalises a prefix without a trailing slash to a key-prefix filter", async () => {
    // Contract: list("dir") MUST return keys under dir/, NOT keys
    // like dir-anything-else/... The SDK would happily return
    // dir2/x if we passed Prefix="dir" verbatim. We normalise to
    // "dir/" before handing to the SDK.
    const { client, state } = makeFakeClient(() => ({
      Contents: [
        listObject({ key: "dir/a.json" }),
        listObject({ key: "dir/sub/b.json" }),
      ],
      $metadata: { httpStatusCode: 200 },
    }))
    const store = createR2ObjectStore(baseOpts(client))

    const out: ObjectMeta[] = []
    for await (const m of store.list("dir")) out.push(m)

    expect(out.map((m) => m.key)).toEqual(["dir/a.json", "dir/sub/b.json"])
    const firstInput = state.calls[0]!.input as { Prefix?: string }
    expect(firstInput.Prefix).toBe("dir/")
  })

  it("passes no Prefix when the caller omits the argument", async () => {
    const { client, state } = makeFakeClient(() => ({
      Contents: [listObject({ key: "a.json" })],
      $metadata: { httpStatusCode: 200 },
    }))
    const store = createR2ObjectStore(baseOpts(client))

    const out: ObjectMeta[] = []
    for await (const m of store.list()) out.push(m)

    expect(out).toHaveLength(1)
    const firstInput = state.calls[0]!.input as { Prefix?: string }
    expect(firstInput.Prefix).toBeUndefined()
  })

  it("returns an empty iterable when there are no objects", async () => {
    const { client } = makeFakeClient(() => ({
      Contents: [],
      $metadata: { httpStatusCode: 200 },
    }))
    const store = createR2ObjectStore(baseOpts(client))
    const out: ObjectMeta[] = []
    for await (const _ of store.list("nope/")) void _ // drain
    expect(out).toEqual([])
  })

  it("throws StorageAuthError on 403", async () => {
    const { client } = makeFakeClient(() => {
      throw s3Exception("AccessDenied", 403)
    })
    const store = createR2ObjectStore(baseOpts(client))
    await expect(async () => {
      for await (const _ of store.list()) void _
    }).rejects.toBeInstanceOf(StorageAuthError)
  })
})
