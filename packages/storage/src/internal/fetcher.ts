/**
 * ETag-aware HTTP fetcher.
 *
 * Wraps `fetch` with two pieces of behaviour that the bare Fetch API
 * does not provide:
 *
 * 1. **Conditional GET**. Sends `If-None-Match` when an ETag is
 *    available; on HTTP 304, returns `{ kind: "not_modified" }`
 *    without consuming the body.
 *
 * 2. **Typed errors**. Translates HTTP status codes and network
 *    failures into the {@link StorageError} hierarchy.
 *
 * The fetcher is not a provider — it is the inner primitive providers
 * compose. The git-tags provider builds its URLs, then calls
 * `fetchJson` to get the wire bytes, then parses with
 * {@link envelope.WireEnvelope}.
 */

import { StorageAuthError } from "../errors.js"
import { StorageNetworkError } from "../errors.js"
import { StorageNotFoundError } from "../errors.js"

export interface FetchJsonOptions {
  /** Existing ETag. Sends `If-None-Match` if set. */
  etag?: string
  /** Optional headers for auth (V2 providers). */
  headers?: Record<string, string>
  /** Signal for cancellation (V2 providers will use this). */
  signal?: AbortSignal
  /** Override the fetch implementation (for tests). */
  fetchImpl?: typeof fetch
}

export type FetchJsonResult<T> =
  | { kind: "ok"; status: number; body: T; etag: string | null }
  | { kind: "not_modified"; etag: string }

/**
 * Fetch a JSON document with ETag handling.
 *
 * Returns:
 *  - `{ kind: "ok", body, etag }` on 200 with parsed JSON body
 *  - `{ kind: "not_modified", etag }` on 304 (caller should use cache)
 *
 * Throws (StorageError subclass):
 *  - {@link StorageNotFoundError} on 404
 *  - {@link StorageAuthError} on 401/403
 *  - {@link StorageNetworkError} on 5xx, network failures, malformed JSON
 */
export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {},
): Promise<FetchJsonResult<T>> {
  const { etag, headers, signal, fetchImpl = fetch } = options

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers ?? {}),
  }
  if (etag) {
    requestHeaders["If-None-Match"] = etag
  }

  let res: Response
  try {
    res = await fetchImpl(url, { headers: requestHeaders, ...(signal ? { signal } : {}) })
  } catch (cause) {
    throw new StorageNetworkError(
      `Network failure fetching ${url}`,
      {},
      { cause },
    )
  }

  if (res.status === 304) {
    if (!etag) {
      // Server returned 304 without us sending If-None-Match.
      // Treat as a network-protocol anomaly.
      throw new StorageNetworkError(
        `Server returned 304 without conditional GET context for ${url}`,
      )
    }
    return { kind: "not_modified", etag }
  }

  if (res.status === 404) {
    throw new StorageNotFoundError(`Not found: ${url}`)
  }

  if (res.status === 401 || res.status === 403) {
    throw new StorageAuthError(
      `Auth failure fetching ${url} (HTTP ${res.status})`,
    )
  }

  if (res.status >= 500) {
    throw new StorageNetworkError(
      `Server error fetching ${url} (HTTP ${res.status})`,
    )
  }

  if (!res.ok) {
    throw new StorageNetworkError(
      `Unexpected status fetching ${url} (HTTP ${res.status})`,
    )
  }

  let body: T
  try {
    body = (await res.json()) as T
  } catch (cause) {
    throw new StorageNetworkError(
      `Malformed JSON in response from ${url}`,
      {},
      { cause },
    )
  }

  const responseEtag = res.headers.get("etag")
  return {
    kind: "ok",
    status: res.status,
    body,
    etag: responseEtag,
  }
}

/**
 * Follow a redirect without ETag handling. Used for the `latest.json`
 * 302 chain. After the final 200, parse via `fetchJson` separately.
 *
 * Currently a thin wrapper — it just returns the final URL. Implement
 * retry-on-redirect when V2 introduces Cloudflare Access redirects.
 */
export async function resolveRedirect(
  url: string,
  options: { fetchImpl?: typeof fetch } = {},
): Promise<string> {
  const fetchImpl = options.fetchImpl ?? fetch
  const res = await fetchImpl(url, { redirect: "follow" })
  return res.url
}
