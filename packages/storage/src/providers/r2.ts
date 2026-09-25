/**
 * Cloudflare R2 implementation of {@link ObjectStore}.
 *
 * Functional style: `createR2ObjectStore(options)` returns an
 * `ObjectStore` whose methods are plain async functions closing
 * over a constructed `S3Client` and the resolved bucket name.
 *
 * Thin adapter over `@aws-sdk/client-s3`. The SDK owns S3-protocol
 * concerns (SigV4 signing, key encoding, XML parsing, pagination,
 * retries). This file owns:
 *
 *   1. Configuring the S3Client against R2's endpoint.
 *   2. Translating ObjectStore verbs to SDK commands.
 *   3. Mapping SDK responses back to ObjectMeta/ObjectBody.
 *   4. Mapping SDK errors to our 4-class taxonomy.
 *
 * The `S3Client` instance is the only class-shaped value here, and
 * it's external to this package — the SDK's I/O boundary. Every
 * helper in this file (error mapping, response normalisation,
 * prefix handling) is a pure top-level function.
 *
 * Errors: see {@link ../errors.ts}. NoSuchKey surfaces as `null`
 * on get/head/delete. Other SDK errors translate via
 * `mapS3Error`. NoSuchBucket on PUT is a thrown
 * StorageNotFoundError (the bucket is missing — a config error the
 * caller must address, not a silent success).
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
   * Pre-read credentials. We do not touch process.env directly so the
   * factory stays explicit about its inputs (testable + deployable
   * to any environment where the caller controls config injection).
   *
   * Note: this factory is Node-only — `Readable.fromWeb` /
   * `Readable.toWeb` are used for stream conversion and are not
   * available in Cloudflare Workers without `nodejs_compat`. On
   * Workers, use the R2 binding directly instead.
   */
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
  /**
   * Optional S3Client override. Production callers omit this; the
   * factory builds a real client with the R2 endpoint. Tests inject
   * a mock to assert command shape without network.
   */
  client?: S3Client
  /** Optional SDK config overrides (retry policy, request handler). */
  clientConfig?: Omit<S3ClientConfig, "endpoint" | "region" | "credentials">
}

/** Default region per Cloudflare's R2 spec. */
const R2_REGION = "auto"

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** Strip surrounding double-quotes from an ETag. Pure. */
function stripQuotes(etag: string): string {
  return etag.replace(/^"|"$/g, "")
}

/**
 * Normalise a list() prefix to undefined (no prefix) or a string
 * ending with "/". S3 prefix matching is a strict string-prefix
 * match, so "foo" without a trailing slash would also match
 * "foobar/..." — which violates the contract. Always normalise
 * before handing to the SDK.
 */
function normaliseListPrefix(prefix: ObjectKey | undefined): string | undefined {
  if (prefix === undefined) return undefined
  return prefix.endsWith("/") ? prefix : `${prefix}/`
}

/** Translate a HeadObjectCommandOutput into ObjectMeta. Pure. */
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

/** Translate a single ListObjectsV2 Contents entry into ObjectMeta. Pure. */
function metaFromListObject(obj: {
  Key?: string | undefined
  Size?: number | undefined
  LastModified?: Date | undefined
  ETag?: string | undefined
}): ObjectMeta {
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

/** True if the SDK error indicates "resource not found". Pure. */
function isNotFound(err: unknown): boolean {
  if (!(err instanceof S3ServiceException)) return false
  if (err.name === "NoSuchKey") return true
  if (err.name === "NotFound") return true
  if (err.$metadata?.httpStatusCode === 404) return true
  return false
}

/** True if the SDK error indicates an auth/credentials failure. Pure. */
function isAuthError(err: unknown): boolean {
  if (!(err instanceof S3ServiceException)) return false
  if (err.name === "InvalidAccessKeyId") return true
  if (err.name === "SignatureDoesNotMatch") return true
  if (err.name === "AccessDenied") return true
  if (err.name === "InvalidToken") return true
  const status = err.$metadata?.httpStatusCode ?? 0
  return status === 401 || status === 403
}

/** Human-readable description of an SDK error. Pure. */
function describeS3Error(err: unknown): string {
  if (err instanceof S3ServiceException) {
    return `${err.name} (${err.$metadata?.httpStatusCode ?? "?"}): ${err.message}`
  }
  if (err instanceof Error) return err.message
  return String(err)
}

/**
 * Translate an SDK error to our 4-class taxonomy. The caller must
 * have already checked `isNotFound` if they want to return null
 * instead of throwing on 404.
 *
 * - 404 (NoSuchKey, NotFound) → StorageNotFoundError
 * - 401/403                  → StorageAuthError
 * - everything else          → StorageNetworkError
 */
function mapS3Error(err: unknown, key: ObjectKey, method: string): never {
  if (err instanceof StorageError) {
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
  throw new StorageNetworkError(
    `R2 ${method} ${key} failed: ${describeS3Error(err)}`,
    { key },
    { cause: err },
  )
}

/** Validate options eagerly. Pure. */
function validateOptions(options: R2Options): void {
  if (!options.accountId) {
    throw new Error("createR2ObjectStore: accountId is required")
  }
  if (!options.bucket) {
    throw new Error("createR2ObjectStore: bucket is required")
  }
  if (!options.credentials.accessKeyId) {
    throw new Error("createR2ObjectStore: accessKeyId is required")
  }
  if (!options.credentials.secretAccessKey) {
    throw new Error("createR2ObjectStore: secretAccessKey is required")
  }
}

/** Build the S3Client against the R2 endpoint. */
function buildClient(options: R2Options): S3Client {
  return (
    options.client ??
    new S3Client({
      region: R2_REGION,
      endpoint: `https://${options.accountId}.r2.cloudflarestorage.com`,
      credentials: options.credentials,
      ...(options.clientConfig ?? {}),
    })
  )
}

/**
 * Build an {@link ObjectStore} backed by Cloudflare R2.
 *
 * The returned object's methods close over `client` and `bucket`.
 * Calling this factory twice gives two independent stores.
 */
export function createR2ObjectStore(options: R2Options): ObjectStore {
  validateOptions(options)
  const client = buildClient(options)
  const bucket = options.bucket

  return {
    async put(key, body) {
      const sdkBody =
        body instanceof Uint8Array
          ? body
          : Readable.fromWeb(body as Parameters<typeof Readable.fromWeb>[0])
      try {
        await client.send(
          new PutObjectCommand({ Bucket: bucket, Key: key, Body: sdkBody }),
        )
      } catch (err) {
        throw mapS3Error(err, key, "PUT")
      }
    },

    async get(key) {
      let out: import("@aws-sdk/client-s3").GetObjectCommandOutput
      try {
        out = await client.send(
          new GetObjectCommand({ Bucket: bucket, Key: key }),
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
      // SDK returns a Node Readable. Convert to Web ReadableStream.
      return Readable.toWeb(out.Body as Readable) as unknown as ObjectBody
    },

    async delete(key) {
      try {
        await client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: key }),
        )
      } catch (err) {
        // Idempotent: ignore NoSuchKey on delete.
        if (isNotFound(err)) return
        throw mapS3Error(err, key, "DELETE")
      }
    },

    async head(key) {
      let out: import("@aws-sdk/client-s3").HeadObjectCommandOutput
      try {
        out = await client.send(
          new HeadObjectCommand({ Bucket: bucket, Key: key }),
        )
      } catch (err) {
        if (isNotFound(err)) return null
        throw mapS3Error(err, key, "HEAD")
      }
      return metaFromHeadResponse(out, key)
    },

    async *list(prefix) {
      const normalised = normaliseListPrefix(prefix)
      const input: { Bucket: string; Prefix?: string } = { Bucket: bucket }
      if (normalised !== undefined) input.Prefix = normalised
      try {
        const paginator = paginateListObjectsV2({ client }, input)
        for await (const page of paginator) {
          for (const obj of page.Contents ?? []) {
            if (!obj.Key) continue
            yield metaFromListObject(obj)
          }
        }
      } catch (err) {
        throw mapS3Error(err, prefix ?? "(root)", "LIST")
      }
    },
  }
}
