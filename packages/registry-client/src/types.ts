/**
 * Public types for `@workspace/registry-client`.
 *
 * The SDK is a thin client over the registry API. It knows nothing about
 * the underlying source (GitHub in V1, R2 in V2) — the server owns
 * resolution, source fetching, descriptor validation, and access
 * control. The SDK validates responses against the public schemas and
 * maps transport-level errors to the {@link RegistryFailure} union.
 *
 * This file is the public surface. Anything not exported here is an
 * implementation detail of the SDK and may change without notice.
 */

import type { TemplateV2 as TemplateV2FromContracts } from "@workspace/contracts/v2"

/**
 * Re-export the `TemplateV2` descriptor type so consumers don't have
 * to import from `@workspace/contracts/v2` directly. The SDK validates
 * descriptors against the canonical Zod schema from that package;
 * re-exporting the inferred TypeScript type keeps the consumer-side
 * types in sync.
 */
export type TemplateV2 = TemplateV2FromContracts

/**
 * A template path. Re-declared here (rather than imported from
 * `@workspace/storage`) so this package doesn't take a runtime
 * dependency on storage. Keys are slash-separated strings; the
 * semantics are documented in the descriptor's `files[].path`.
 */
// eslint-disable-next-line sonarjs/redundant-type-aliases
export type ObjectKey = string

/**
 * The result of `fetchDescriptor`: a validated descriptor plus a map
 * of `path → URL` for each file declared in `descriptor.files[]`.
 *
 * The SDK does NOT know what those URLs are (GitHub raw in V1,
 * signed R2 URLs in V2). Consumers fetch the URLs themselves.
 */
export type FetchedTemplate = {
  /** Descriptor validated by Zod (defence-in-depth re-validation). */
  readonly descriptor: TemplateV2
  /**
   * URL fetchable for each file declared in `descriptor.files[]`.
   * Keys are paths; values are opaque URLs the consumer must fetch
   * with the global `fetch` (or any other HTTP client).
   */
  readonly files: Readonly<Record<ObjectKey, string>>
}

/**
 * A single entry in the catalog returned by `listCatalog`.
 *
 * The catalog is the editorial list of available templates. It's a
 * preview — consumers that need the full descriptor should call
 * `fetchDescriptor(slug)`.
 */
export type CatalogEntry = {
  /** Canonical template identifier (e.g. `@deessejs/nextjs-saas`). */
  readonly slug: string
  /** Human-readable title. */
  readonly title: string
  /** Optional short description. */
  readonly description?: string
  /**
   * Editorial layer. The CLI/web use this for visual cues
   * ("pro" templates highlighted differently from "open-community").
   */
  readonly layer: "open-community" | "pro" | "enterprise"
  /** Latest published version (semver). */
  readonly latestVersion: string
}

/**
 * Options for `fetchDescriptor`.
 *
 * `ref` lets callers pin to a specific version (tag, branch, or SHA).
 * When omitted, the server resolves to the latest stable version.
 */
export type FetchOptions = {
  readonly ref?: string
}

/**
 * Options for the SDK factory.
 */
export type RegistryClientOptions = {
  /**
   * Base URL of the registry API. Must be a full URL with no trailing
   * slash (the SDK uses `new URL(path, base)` to compose requests).
   */
  readonly apiUrl: string
  /**
   * Optional `fetch` override. Tests inject a mock; production uses
   * the global `fetch`.
   */
  readonly fetchImpl?: typeof fetch
}

/**
 * Discriminated union of every failure the SDK can surface to a
 * consumer. Plain data — switch on `_tag`, no `instanceof`.
 *
 * Each variant carries the minimum context to act on the failure:
 *
 *   - `RegistryNotFound` — slug does not exist in the catalog.
 *   - `RegistryFetchFailed` — upstream provider (GitHub/R2) failed;
 *     the API could not satisfy the request.
 *   - `RegistryInvalidDescriptor` — the descriptor returned by the
 *     API did not validate against `TemplateV2Schema`. Either the
 *     server has a bug or the wire contract drifted.
 *   - `RegistryNetworkError` — the consumer cannot reach the API
 *     (DNS failure, timeout, ECONNRESET).
 *   - `RegistryAuthRequired` — the template is gated (R2 future);
 *     the consumer must authenticate first.
 *   - `RegistryUnsupportedSource` — guard rail: should never happen
 *     in production. Caught early to surface a bug.
 */
export type RegistryFailure =
  | { readonly _tag: "RegistryNotFound"; readonly slug: string }
  | {
      readonly _tag: "RegistryFetchFailed"
      readonly slug: string
      readonly cause: unknown
    }
  | {
      readonly _tag: "RegistryInvalidDescriptor"
      readonly slug: string
      readonly cause: unknown
    }
  | {
      readonly _tag: "RegistryNetworkError"
      readonly slug: string
      readonly cause: unknown
    }
  | { readonly _tag: "RegistryAuthRequired"; readonly slug: string }
  | { readonly _tag: "RegistryUnsupportedSource"; readonly source: string }

/**
 * Result of an SDK operation. Discriminated union: `Ok` carries the
 * value, `Err` carries a {@link RegistryFailure}.
 *
 * The SDK never throws — it always returns a Result. Consumers
 * pattern-match on `_tag` to handle success vs failure.
 */
export type Result<T, E> =
  | { readonly _tag: "Ok"; readonly value: T }
  | { readonly _tag: "Err"; readonly error: E }

/**
 * Construct an `Ok` result. Pure data constructor.
 */
export const ok = <T>(value: T): Result<T, never> => ({
  _tag: "Ok",
  value,
})

/**
 * Construct an `Err` result. Pure data constructor.
 */
export const err = <E>(error: E): Result<never, E> => ({
  _tag: "Err",
  error,
})

/**
 * The fundamental interface every registry client must satisfy.
 *
 * The SDK exposes two operations:
 *
 *   - `fetchDescriptor` resolves a slug to a validated descriptor
 *     plus URLs for each file.
 *   - `listCatalog` returns the editorial list of available
 *     templates (cheap call, no descriptor fetch).
 *
 * Both return `Promise<Result<...>>` — the SDK never throws.
 */
export type RegistryClient = {
  readonly fetchDescriptor: (
    slug: string,
    options?: FetchOptions,
  ) => Promise<Result<FetchedTemplate, RegistryFailure>>
  readonly listCatalog: () => Promise<Result<readonly CatalogEntry[], RegistryFailure>>
}
