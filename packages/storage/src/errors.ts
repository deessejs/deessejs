/**
 * Storage error taxonomy.
 *
 * All errors thrown by this package extend {@link StorageError}. The
 * subclass names are the public contract — callers branch on
 * `instanceof`, not on string matching. Adding a new subclass is a
 * semver-minor (additive); changing the inheritance is a semver-major.
 *
 * Pattern: borrowed from npm's `npm ERR_*` semantics. Each subclass
 * carries a stable `code` field so external log scrapers and
 * documentation can reference errors by symbol, not by message.
 */

export class StorageError extends Error {
  /** Stable identifier for log aggregation. Lowercase, dot-separated. */
  readonly code: string
  /** The slug and ref that triggered the failure, if known. */
  readonly context: { slug?: string; ref?: string }

  constructor(
    code: string,
    message: string,
    context: { slug?: string; ref?: string } = {},
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
 * The requested slug does not exist in the registry, or the ref is not
 * pinned to any published version. Maps to HTTP 404.
 *
 * Note: this does NOT distinguish "never published" from "removed by
 * the registry maintainer". Callers that need that distinction should
 * call `provider.publish` audit logs; consumers see only "not_found".
 */
export class StorageNotFoundError extends StorageError {
  constructor(
    message: string,
    context: { slug?: string; ref?: string } = {},
    options?: { cause?: unknown },
  ) {
    super("storage.not_found", message, context, options)
  }
}

/**
 * Authentication failed for an authenticated provider (V2+). Maps to
 * HTTP 401/403. The V1 git-tags provider does not throw this error.
 */
export class StorageAuthError extends StorageError {
  constructor(
    message: string,
    context: { slug?: string; ref?: string } = {},
    options?: { cause?: unknown },
  ) {
    super("storage.auth", message, context, options)
  }
}

/**
 * The local cache was asked for an item that has never been fetched.
 * Distinct from `StorageNotFoundError` (which means the *registry*
 * has no such item): this means the local cache is empty for a
 * provider-known item.
 *
 * Triggers the offline-mode violation in CI: a CI run that needs a
 * descriptor must pre-populate the cache via `provider.acquire`
 * outside of CI.
 */
export class StorageCacheMissError extends StorageError {
  constructor(
    message: string,
    context: { slug?: string; ref?: string } = {},
    options?: { cause?: unknown },
  ) {
    super("storage.cache_miss", message, context, options)
  }
}

/**
 * The fetch failed for a transient reason (DNS, TLS, timeout, 5xx).
 * Callers may retry with backoff. Maps to network-level errors and
 * HTTP 5xx.
 */
export class StorageNetworkError extends StorageError {
  constructor(
    message: string,
    context: { slug?: string; ref?: string } = {},
    options?: { cause?: unknown },
  ) {
    super("storage.network", message, context, options)
  }
}

/**
 * The provider attempted an outbound HTTP request while in offline
 * mode (CI environment or explicit override). Per ADR-033 §171, this
 * is a hard refusal — not a soft warning. Resolved by either pre-
 * populating the cache or running outside CI.
 */
export class StorageOfflineViolationError extends StorageError {
  constructor(
    message: string,
    context: { slug?: string; ref?: string } = {},
    options?: { cause?: unknown },
  ) {
    super("storage.offline_violation", message, context, options)
  }
}

/**
 * The descriptor was fetched but its Zod schema validation failed.
 * The wire shape is rejected. This is a content error, not a network
 * error — retrying won't help.
 *
 * The `cause` carries the original ZodError so callers can format
 * per-issue diagnostics.
 */
export class StorageInvalidDescriptorError extends StorageError {
  constructor(
    message: string,
    context: { slug?: string; ref?: string } = {},
    options?: { cause?: unknown },
  ) {
    super("storage.invalid_descriptor", message, context, options)
  }
}
