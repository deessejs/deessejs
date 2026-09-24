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
 * Errors: see {@link ./errors.ts}. The four classes (`StorageError`,
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
export interface ObjectMeta {
  /** Object key this metadata is for. */
  readonly key: ObjectKey
  /** Total object size in bytes. Undefined if the provider doesn't know. */
  readonly size?: number
  /**
   * Hex-encoded MD5 or SHA-256 of the body. Used for client-side
   * integrity checks. Different providers use different hash
   * algorithms; the field stores whatever the provider returned.
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
 * The fundamental object storage interface.
 *
 * All five methods MUST be implemented. The interface is async-only;
 * no synchronous variant exists (local-fs uses fs.promises).
 */
export interface ObjectStore {
  /**
   * PUT bytes at `key`. Idempotent: PUTing the same key twice replaces
   * the value. `body` is consumed; the caller must not use it after.
   *
   * Implementations may choose to stream the body (R2 preferred,
   * efficient for large objects) or buffer it (local-fs simpler for
   * small files, atomic-write guarantees).
   *
   * Throws:
   *  - {@link StorageAuthError} on 401/403
   *  - {@link StorageNetworkError} on transient failure
   *  - {@link StorageError} base class for anything else
   */
  put(key: ObjectKey, body: Uint8Array | ObjectBody): Promise<void>

  /**
   * GET bytes for `key`. Returns null on a 404 (so callers can branch
   * without catching). Throws {@link StorageNotFoundError} only when
   * the caller wants the exception path (rare — most callers prefer
   * null for the "not found" branch).
   *
   * The returned stream is owned by the caller. Reading past EOF
   * returns empty bytes; cancellation aborts the in-flight fetch.
   */
  get(key: ObjectKey): Promise<ObjectBody | null>

  /**
   * DELETE the object at `key`. Idempotent — succeeds even if absent.
   * Used for cleanup, eviction, and re-publication flows.
   */
  delete(key: ObjectKey): Promise<void>

  /**
   * HEAD the object — return metadata without body. Returns null
   * if absent.
   *
   * Preferred over `get()` for callers that only need size/etag/
   * lastModified. Avoids paying for bytes that won't be used.
   */
  head(key: ObjectKey): Promise<ObjectMeta | null>

  /**
   * LIST keys under an optional prefix.
   *
   * Returned as an AsyncIterable, not an array, because some
   * providers (R2, S3) paginate and materialising 10k objects in
   * memory would defeat the point of streaming. Consumers process
   * one item at a time and break out when they have enough.
   *
   * The prefix is included in the returned keys (the consumer doesn't
   * have to re-prepend it). Sorted or not: unspecified — depends
   * on the provider.
   */
  list(prefix?: ObjectKey): AsyncIterable<ObjectMeta>
}
