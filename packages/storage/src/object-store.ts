/**
 * Pure object storage abstraction.
 *
 * Reads and writes opaque bytes at opaque keys. Knows nothing about
 * templates, descriptors, JSON, Zod, or namespaces. Two
 * implementations are documented for V1: a local-filesystem impl for
 * dev/CI/tests, and a Cloudflare R2 impl for production.
 *
 * The shape is the **least common denominator** of object stores
 * (S3 API, R2, MinIO, local disk): a key addressing scheme plus 5
 * verbs. Anything more sophisticated (multipart upload, server-side
 * copy, tagging) lives on the future impls, not on this interface.
 *
 * Errors: see `./errors.ts`. The four classes (`StorageError`,
 * `StorageNotFoundError`, `StorageAuthError`, `StorageNetworkError`)
 * are the only error contract; implementations MUST throw these
 * exactly. Higher-level errors (cache miss, offline) belong to the
 * consumer.
 */

/**
 * An opaque object key.
 *
 * The interpretation of slashes is provider-specific (R2 has flat
 * keys with `/` as a path separator, the local-fs impl uses `/` as
 * a directory separator). The interface treats keys as opaque; the
 * caller chooses a naming scheme (`templates/nextjs-app-router-saas/v1.4.0.json`
 * is the suggested convention but not enforced here).
 */
// ObjectKey is intentionally a named alias — the consumer-facing
// name documents intent better than raw `string` at every call
// site.
// eslint-disable-next-line sonarjs/redundant-type-aliases
export type ObjectKey = string


/**
 * Metadata returned by `head()` (and surfaced by implementations
 * alongside `get()` when the provider exposes it cheaply).
 *
 * The fields here are the intersection of what R2, S3, and the local
 * filesystem can all surface. Provider-specific metadata (e.g. S3
 * `ETag` with quotes, R2 `httpEtag`) is exposed via the
 * rawHeaders map for callers that need it.
 */
export type ObjectMeta = {
  /** Object key this metadata is for. */
  readonly key: ObjectKey
  /** Total object size in bytes. Undefined if the provider doesn't know. */
  readonly size?: number
  /**
   * Opaque version identifier returned by the provider (R2/S3 `ETag`).
   *
   * **DO NOT treat this as a content hash.** S3-compatible ETags are
   * typically MD5 only for single-part PUTs of small bodies; for
   * multipart uploads, multi-part objects, or composite operations,
   * the ETag is a composite identifier that does not match the body
   * byte-for-byte. If you need integrity verification, hash the body
   * yourself at write time and store the digest alongside the key.
   *
   * Quotes (when present) are part of the raw header; callers should
   * strip them if comparing against unquoted digests.
   */
  readonly etag?: string
  /** ISO-8601 timestamp of last modification, if known. */
  readonly lastModified?: string
  /** Content-Type header value, if the provider carries it. */
  readonly contentType?: string
  /** Provider-specific headers, for callers that need them. */
  readonly rawHeaders?: ReadonlyMap<string, string>
}

/**
 * The bytes of an object, fetched lazily.
 *
 * `ReadableStream` is the Web Streams shape, available natively in
 * Node 20+, browsers, Workers, Deno, Bun. Implementations may buffer
 * the entire body before returning the stream (acceptable for small
 * descriptors), or stream it lazily (preferred for large objects).
 *
 * The stream is consumed once; subsequent reads return empty. The
 * caller controls lifecycle via the standard stream cancellation.
 */
export type ObjectBody = ReadableStream<Uint8Array>

/**
 * Discriminated union of every failure this package can produce.
 *
 * Plain data — no classes, no `instanceof`. Branch on
 * `failure._tag`. Every variant carries a stable `_tag` string and
 * the minimum context needed to act on it.
 *
 *   - `StorageInvalidKey` — caller-supplied key failed validation
 *     (empty, absolute, `..` segment). `key` is set.
 *   - `StorageInvalidRoot` / `StorageInvalidOptions` — factory
 *     options rejected.
 *   - `StorageNotFound` — `get`/`head`/`delete` against an absent
 *     key (404 NoSuchKey). `key` always set.
 *   - `StorageMissingBucket` — `put`/`list` against a bucket the
 *     SDK reports as missing (404 NoSuchBucket). `key` may be
 *     undefined on `list`.
 *   - `StorageAuth` — credentials rejected or signature mismatch
 *     (401/403). `cause` carries the SDK error.
 *   - `StorageNetwork` — 5xx, transport failure, throttling.
 *     `cause` carries the underlying error.
 *   - `StorageUnexpected` — anything that doesn't fit the above
 *     buckets (e.g. SDK bug, missing body). `cause` carries the
 *     underlying error.
 *
 * Helpers in this file wrap plain values in `Error` for `throw`,
 * preserving the union via `error.cause`. Consumers catch with
 * `instanceof Error` and switch on `(err.cause as StorageFailure)._tag`.
 */
export type StorageFailure =
  | { readonly _tag: "StorageInvalidKey"; readonly key: ObjectKey }
  | {
      readonly _tag: "StorageInvalidRoot"
      readonly message: string
    }
  | {
      readonly _tag: "StorageInvalidOptions"
      readonly message: string
    }
  | { readonly _tag: "StorageNotFound"; readonly key: ObjectKey }
  | {
      readonly _tag: "StorageMissingBucket"
      readonly key?: ObjectKey
      readonly cause: unknown
    }
  | {
      readonly _tag: "StorageAuth"
      readonly key: ObjectKey
      readonly cause: unknown
    }
  | {
      readonly _tag: "StorageNetwork"
      readonly key: ObjectKey
      readonly cause: unknown
    }
  | {
      readonly _tag: "StorageUnexpected"
      readonly key: ObjectKey
      readonly cause: unknown
    }

/**
 * Wrap a {@link StorageFailure} in a runtime `Error`. The failure is
 * preserved on `error.cause` so consumers can pattern-match on it.
 *
 * The wrapping is necessary because TypeScript and the JS runtime
 * both want a real `Error` at the top of the chain (stack traces,
 * `instanceof Error` checks, logging pipelines). The shape of the
 * failure is what consumers should switch on.
 */
export const toStorageError = (
  failure: StorageFailure,
  message: string,
): Error => {
  const err = new Error(message)
  err.name = failure._tag
  ;(err as Error & { cause: StorageFailure }).cause = failure
  return err
}

/**
 * Type guard: returns the {@link StorageFailure} if the given
 * value was thrown by this package, or `null` otherwise.
 *
 * ```
 * try {
 *   await store.put(key, bytes)
 * } catch (err) {
 *   const failure = asStorageFailure(err)
 *   if (failure?._tag === "StorageAuth") { ... }
 * }
 * ```
 */
export const asStorageFailure = (err: unknown): StorageFailure | null => {
  if (
    err !== null &&
    typeof err === "object" &&
    "cause" in err &&
    typeof (err as { cause: unknown }).cause === "object" &&
    (err as { cause: { _tag?: unknown } }).cause !== null &&
    typeof (err as { cause: { _tag?: unknown } }).cause._tag === "string" &&
    ((err as { cause: { _tag: string } }).cause._tag as string).startsWith(
      "Storage",
    )
  ) {
    return (err as { cause: StorageFailure }).cause
  }
  return null
}

/**
 * The fundamental object storage interface.
 *
 * All five methods MUST be implemented. The interface is async-only;
 * no synchronous variant exists (local-fs uses fs.promises).
 *
 * Implementations throw the four typed error classes from
 * `./errors.ts` (see also {@link StorageNotFoundError} for the
 * `get`/`head`/`delete` 404 case, which returns `null` instead).
 */
export type ObjectStore = {
  /**
   * PUT bytes at `key`. Idempotent: PUTing the same key twice
   * replaces the value. `body` is consumed; the caller must not use
   * it after.
   *
   * Implementations may choose to stream the body (R2 preferred,
   * efficient for large objects) or buffer it (local-fs simpler
   * for small files, atomic-write guarantees).
   *
   * Throws:
   *  - {@link StorageAuthError} on 401/403
   *  - {@link StorageNetworkError} on transient failure
   *  - {@link StorageNotFoundError} if the bucket is missing
   *  - {@link StorageError} base class for anything else
   */
  readonly put: (
    key: ObjectKey,
    body: Uint8Array | ObjectBody,
  ) => Promise<void>

  /**
   * GET bytes for `key`. Returns null on a 404 (so callers can
   * branch without catching). Throws {@link StorageNotFoundError}
   * only when the caller wants the exception path (rare — most
   * callers prefer null for the "not found" branch).
   *
   * The returned stream is owned by the caller. Reading past EOF
   * returns empty bytes; cancellation aborts the in-flight fetch.
   */
  readonly get: (key: ObjectKey) => Promise<ObjectBody | null>

  /**
   * DELETE the object at `key`. Idempotent — succeeds even if
   * absent. Used for cleanup, eviction, and re-publication flows.
   */
  readonly delete: (key: ObjectKey) => Promise<void>

  /**
   * HEAD the object — return metadata without body. Returns null
   * if absent.
   *
   * Preferred over `get()` for callers that only need size/etag/
   * lastModified. Avoids paying for bytes that won't be used.
   */
  readonly head: (key: ObjectKey) => Promise<ObjectMeta | null>

  /**
   * LIST keys, optionally filtered by prefix.
   *
   * Returned as an AsyncIterable, not an array, because some
   * providers (R2, S3) paginate and materialising 10k objects in
   * memory would defeat the point of streaming. Consumers process
   * one item at a time and break out when they have enough.
   *
   * **`prefix` semantics (locked contract):**
   *   - `prefix === undefined` → all keys in the bucket/root
   *   - `prefix === "foo"` → all keys that begin with `"foo/"`
   *   - `prefix === "foo/"` → all keys that begin with `"foo/"`
   *     (trailing slash normalised identically)
   *
   * The prefix is included in the returned keys (the consumer does
   * not have to re-prepend it). The prefix is **always** treated as
   * a key-prefix filter, never as a directory path — `list("dir/b")`
   * returns keys under `dir/b/`, NOT children of a `dir/b/`
   * directory. This matches R2/S3 semantics; the local-fs
   * implementation must honour it.
   *
   * Sorting is unspecified — depends on the provider.
   *
   * Key encoding (special characters, XML escapes, Unicode) is the
   * provider's responsibility. Callers receive keys verbatim.
   */
  readonly list: (prefix?: ObjectKey) => AsyncIterable<ObjectMeta>
}
