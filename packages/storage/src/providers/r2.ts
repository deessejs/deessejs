/**
 * Cloudflare R2 implementation of {@link ObjectStore}.
 *
 * Thin adapter over `@aws-sdk/client-s3`. The SDK owns the
 * S3-protocol concerns (SigV4 signing, key encoding, XML parsing,
 * pagination, retries). This file is only responsible for:
 *
 *   1. Configuring the S3Client against R2's endpoint
 *      (`https://<account>.r2.cloudflarestorage.com`, region "auto").
 *   2. Translating ObjectStore verbs to SDK commands.
 *   3. Mapping SDK responses back to ObjectMeta/ObjectBody.
 *   4. Mapping SDK errors to our 4-class taxonomy.
 *
 * Endpoints we hit:
 *   PutObjectCommand       → put
 *   GetObjectCommand       → get
 *   HeadObjectCommand      → head
 *   DeleteObjectCommand    → delete
 *   ListObjectsV2Command   → list (paginated via the SDK paginator)
 *
 * Errors: see {@link ../errors.ts}. We translate S3 service errors
 * to the 4 storage classes. NoSuchKey surfaces as `null` on get/head,
 * and as a thrown StorageNotFoundError on delete/put (404 on those
 * verbs typically means the bucket itself is missing — a config
 * error the caller must address).
 */

import { Readable } from "node:stream"

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
  type S3ClientConfig,
  paginateListObjectsV2,
  PutObjectCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3"

import {
  StorageAuthError,
  StorageError,
  StorageNetworkError,
  StorageNotFoundError,
} from "../errors.js"
import type {
  ObjectBody,
  ObjectKey,
  ObjectMeta,
  ObjectStore,
} from "../object-store.js"

export interface R2Options {
  /** Cloudflare account ID (numeric). */
  accountId: string
  /** R2 bucket name. */
  bucket: string
  /**
   * Pre-read credentials. We do not touch process.env directly so
   * the constructor stays portable across runtimes (Vercel/Node,
   * future Workers).
   */
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
  /**
   * Optional S3Client override. Production callers omit this; the
   * constructor builds a real client with the R2 endpoint.
   * Tests inject a mock to assert command shape without network.
   */
  client?: S3Client
  /** Optional SDK config overrides (retry policy, request handler). */
  clientConfig?: Omit<S3ClientConfig, "endpoint" | "region" | "credentials">
}

/** Default region per Cloudflare's R2 spec. */
const R2_REGION = "auto"

export class R2ObjectStore implements ObjectStore {
  private readonly client: S3Client
  private readonly bucket: string

  constructor(options: R2Options) {
    if (!options.accountId) {
      throw new Error("R2ObjectStore: accountId is required")
    }
    if (!options.bucket) {
      throw new Error("R2ObjectStore: bucket is required")
    }
    if (!options.credentials.accessKeyId) {
      throw new Error("R2ObjectStore: accessKeyId is required")
    }
    if (!options.credentials.secretAccessKey) {
      throw new Error("R2ObjectStore: secretAccessKey is required")
    }
    this.bucket = options.bucket
    this.client =
      options.client ??
      new S3Client({
        region: R2_REGION,
        endpoint: `https://${options.accountId}.r2.cloudflarestorage.com`,
        credentials: options.credentials,
        ...(options.clientConfig ?? {}),
      })
  }

  async put(key: ObjectKey, body: Uint8Array | ObjectBody): Promise<void> {
    // The SDK accepts Uint8Array, Blob, string, or Node Readable.
    // Web ReadableStream needs an adapter.
    const sdkBody =
      body instanceof Uint8Array
        ? body
        : Readable.fromWeb(body as Parameters<typeof Readable.fromWeb>[0])
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: sdkBody,
        }),
      )
    } catch (err) {
      throw mapS3Error(err, key, "PUT")
    }
  }

  async get(key: ObjectKey): Promise<ObjectBody | null> {
    let out: import("@aws-sdk/client-s3").GetObjectCommandOutput
    try {
      out = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      )
    } catch (err) {
      if (isNotFound(err)) return null
      throw mapS3Error(err, key, "GET")
    }
    if (!out.Body) {
      throw new StorageError(
        "storage.empty_body",
        `Empty body on GET ${key}`,
        { key },
      )
    }
    // SDK returns a Node Readable. Convert to Web ReadableStream so
    // callers see the same shape regardless of provider.
    return Readable.toWeb(out.Body as Readable) as unknown as ObjectBody
  }

  async delete(key: ObjectKey): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      )
    } catch (err) {
      // Idempotent: S3 returns success on delete-already-absent; the
      // SDK does not raise on this case. We still defend against a
      // 404 by ignoring it — see bug review note #3 about PUT 404,
      // which is the symmetric concern.
      if (isNotFound(err)) return
      throw mapS3Error(err, key, "DELETE")
    }
  }

  async head(key: ObjectKey): Promise<ObjectMeta | null> {
    let out: import("@aws-sdk/client-s3").HeadObjectCommandOutput
    try {
      out = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      )
    } catch (err) {
      if (isNotFound(err)) return null
      throw mapS3Error(err, key, "HEAD")
    }
    return metaFromHeadResponse(out, key)
  }

  async *list(prefix?: ObjectKey): AsyncIterable<ObjectMeta> {
    // The SDK's paginateListObjectsV2 returns an async iterable
    // that handles ContinuationToken / NextContinuationToken under
    // the hood. Each yielded page contains Contents[] (the items
    // we want) and CommonPrefixes (delimited groupings; we ignore
    // them — flat-key matching is what our contract promises).
    //
    // Contract: a prefix without a trailing slash ("foo") is
    // equivalent to "foo/" — list under that key-prefix. We must
    // normalise BEFORE handing the prefix to S3, otherwise "foo"
    // would also match "foobar/..." which violates the contract.
    const normalisedPrefix =
      prefix === undefined
        ? undefined
        : prefix.endsWith("/")
          ? prefix
          : `${prefix}/`
    const input: { Bucket: string; Prefix?: string } = { Bucket: this.bucket }
    if (normalisedPrefix !== undefined) input.Prefix = normalisedPrefix
    try {
      const paginator = paginateListObjectsV2(
        { client: this.client },
        input,
      )
      for await (const page of paginator) {
        for (const obj of page.Contents ?? []) {
          if (!obj.Key) continue
          yield metaFromListObject(obj, prefix)
        }
      }
    } catch (err) {
      throw mapS3Error(err, prefix ?? "(root)", "LIST")
    }
  }
}

// ---------------------------------------------------------------------------
// Error mapping
// ---------------------------------------------------------------------------

/**
 * Match SDK errors to our 4-class taxonomy.
 *
 * - 404 (NoSuchKey, NotFound) → caller decides (returns null or throws)
 * - 401/403 (auth)            → StorageAuthError
 * - 5xx, network, throttle    → StorageNetworkError
 * - everything else           → StorageError (base) with the SDK error as cause
 */
function mapS3Error(err: unknown, key: ObjectKey, method: string): never {
  if (err instanceof StorageError) {
    // Already mapped by an inner call; re-throw preserving context.
    throw err
  }
  if (isNotFound(err)) {
    throw new StorageNotFoundError(
      `R2 ${method} ${key} failed: resource not found`,
      { key },
      { cause: err },
    )
  }
  if (isAuthError(err)) {
    throw new StorageAuthError(
      `R2 ${method} ${key} failed: ${describeS3Error(err)}`,
      { key },
      { cause: err },
    )
  }
  // Everything else is treated as network/server fault.
  throw new StorageNetworkError(
    `R2 ${method} ${key} failed: ${describeS3Error(err)}`,
    { key },
    { cause: err },
  )
}

function isNotFound(err: unknown): boolean {
  if (!(err instanceof S3ServiceException)) return false
  // SDK exposes both $metadata.httpStatusCode and named error
  // classes. The named classes are the most reliable check.
  if (err.name === "NoSuchKey") return true
  if (err.name === "NotFound") return true
  if (err.$metadata?.httpStatusCode === 404) return true
  return false
}

function isAuthError(err: unknown): boolean {
  if (!(err instanceof S3ServiceException)) return false
  if (err.name === "InvalidAccessKeyId") return true
  if (err.name === "SignatureDoesNotMatch") return true
  if (err.name === "AccessDenied") return true
  if (err.name === "InvalidToken") return true
  const status = err.$metadata?.httpStatusCode ?? 0
  return status === 401 || status === 403
}

function describeS3Error(err: unknown): string {
  if (err instanceof S3ServiceException) {
    return `${err.name} (${err.$metadata?.httpStatusCode ?? "?"}): ${err.message}`
  }
  if (err instanceof Error) return err.message
  return String(err)
}

// ---------------------------------------------------------------------------
// Response → ObjectMeta
// ---------------------------------------------------------------------------

function metaFromHeadResponse(
  out: {
    ETag?: string | undefined
    ContentLength?: number | undefined
    LastModified?: Date | undefined
    ContentType?: string | undefined
  },
  key: ObjectKey,
): ObjectMeta {
  const meta: {
    key: ObjectKey
    etag?: string
    size?: number
    lastModified?: string
    contentType?: string
  } = { key }
  if (out.ETag) meta.etag = stripQuotes(out.ETag)
  if (typeof out.ContentLength === "number") meta.size = out.ContentLength
  if (out.LastModified) meta.lastModified = out.LastModified.toISOString()
  if (out.ContentType) meta.contentType = out.ContentType
  return meta
}

function metaFromListObject(
  obj: {
    Key?: string | undefined
    Size?: number | undefined
    LastModified?: Date | undefined
    ETag?: string | undefined
  },
  prefix?: ObjectKey,
): ObjectMeta {
  // The SDK returns decoded keys (XML entities already resolved).
  // Prefix is included in the returned keys; we don't trim it here
  // because the contract says the consumer doesn't need to re-prepend.
  void prefix
  const meta: {
    key: ObjectKey
    size?: number
    lastModified?: string
    etag?: string
  } = { key: obj.Key as ObjectKey }
  if (typeof obj.Size === "number") meta.size = obj.Size
  if (obj.LastModified) meta.lastModified = obj.LastModified.toISOString()
  if (obj.ETag) meta.etag = stripQuotes(obj.ETag)
  return meta
}

function stripQuotes(etag: string): string {
  // R2 returns ETags with surrounding double-quotes (HTTP RFC 7232).
  // Most consumers expect them stripped for direct comparison.
  return etag.replace(/^"|"$/g, "")
}
