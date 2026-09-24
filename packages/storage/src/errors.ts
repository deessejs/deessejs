/**
 * Storage error taxonomy.
 *
 * Errors thrown by this package extend {@link StorageError}. Every
 * subclass carries a stable `code` field so log scrapers and docs
 * can reference errors by symbol, not by message string.
 *
 * Adding a new subclass is semver-minor (additive). Changing the
 * inheritance of an existing subclass is semver-major.
 *
 * This is the **low-level** taxonomy. It maps HTTP and transport
 * failures at the bytes layer. Higher-level concerns (cache miss,
 * offline mode, malformed descriptor) live in `@workspace/registry-client`,
 * not here. Storage errors know nothing about templates, blocks,
 * descriptors, or JSON.
 *
 * Mappings to HTTP status:
 *   StorageNotFoundError       <- 404 / NoSuchKey / NotFound
 *   StorageAuthError           <- 401 / 403 / AccessDenied / InvalidAccessKeyId
 *   StorageNetworkError        <- 5xx / network failure / timeout / TLS
 *
 * The CLI / consumer maps these to UX: 404 = missing template, 403 =
 * missing credentials, 5xx = retry. They never see this class
 * hierarchy treated as anything other than "I cannot get this
 * object".
 */

export class StorageError extends Error {
  /** Stable identifier for log aggregation. Lowercase, dot-separated. */
  readonly code: string
  /** Object key (if known) that triggered the failure. */
  readonly context: { key?: string }

  constructor(
    code: string,
    message: string,
    context: { key?: string } = {},
    options?: { cause?: unknown },
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.context = context
    if (options?.cause !== undefined) {
      ;(this as Error & { cause?: unknown }).cause = options.cause
    }
  }
}

/**
 * The object does not exist at the given key. Maps to HTTP 404 in S3
 * terminology, or the equivalent of `NoSuchKey` for native providers.
 *
 * Provoking this on a request that "should" succeed is a bug in the
 * caller's key generation. We do not distinguish "never existed"
 * from "deleted between calls"; the caller can read an audit log if
 * that distinction matters.
 */
export class StorageNotFoundError extends StorageError {
  constructor(
    message: string,
    context: { key?: string } = {},
    options?: { cause?: unknown },
  ) {
    super("storage.not_found", message, context, options)
  }
}

/**
 * The provider rejected the credentials, the credentials are missing,
 * or the storage backend refused the request on auth grounds. Maps to
 * HTTP 401 / 403 / S3 `AccessDenied` / `InvalidAccessKeyId`.
 *
 * For SigV4 this typically means: clock skew outside the ±5 min
 * tolerance, a malformed canonical request, or a wrong access key.
 * The error message should distinguish these to the extent the
 * provider reports them.
 */
export class StorageAuthError extends StorageError {
  constructor(
    message: string,
    context: { key?: string } = {},
    options?: { cause?: unknown },
  ) {
    super("storage.auth", message, context, options)
  }
}

/**
 * The fetch failed for a transient reason: DNS, TLS, timeout, 5xx,
 * connection reset. Callers may retry with backoff. Maps to network
 * errors and HTTP 5xx.
 *
 * Distinct from {@link StorageAuthError} so the consumer can decide
 * "retry" vs "show config error" without parsing messages.
 */
export class StorageNetworkError extends StorageError {
  constructor(
    message: string,
    context: { key?: string } = {},
    options?: { cause?: unknown },
  ) {
    super("storage.network", message, context, options)
  }
}
