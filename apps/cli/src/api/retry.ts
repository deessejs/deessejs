import { USER_AGENT } from "../constants/agent.js"

export type FetchRetryOptions = {
  apiUrl: string
  method?: string
  body?: string
  headers?: Record<string, string>
  /** Maximum number of attempts. Default 3. */
  maxAttempts?: number
}

export type FetchRetryResult = {
  status: number
  bodyText: string
  etag: string | null
}

const BASE_DELAYS_MS = [250, 750, 2000]

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

const jitter = (base: number): number =>
  base + Math.floor(Math.random() * 100)

/**
 * Fetch with retry on transient failures.
 *
 * Retries on:
 *   - network errors (the `fetch` itself throws)
 *   - HTTP 5xx
 *   - HTTP 429 (rate-limited): honors the X-RateLimit-Reset header
 *     instead of the static backoff, so we don't sleep longer than needed.
 *
 * Aborts (returns the failing response) on:
 *   - HTTP 4xx other than 429. A 404 on /templates will still be a 404
 *     in 3 seconds; the user gets a faster error.
 *
 * Returns the final response (success or terminal failure) and a
 * `bodyText` ready to JSON.parse. The caller is responsible for parsing
 * — we don't presume the schema here.
 */
export const fetchWithRetry = async (
  opts: FetchRetryOptions,
): Promise<FetchRetryResult> => {
  const maxAttempts = opts.maxAttempts ?? 3
  const headers: Record<string, string> = {
    "user-agent": USER_AGENT,
    accept: "application/json",
    ...(opts.headers ?? {}),
  }

  let lastNetworkError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let res: Response
    try {
      const init: RequestInit = {
        method: opts.method ?? "GET",
        headers,
      }
      if (opts.body !== undefined) init.body = opts.body
      res = await fetch(opts.apiUrl, init)
    } catch (e) {
      lastNetworkError = e
      if (attempt < maxAttempts - 1) {
        await sleep(jitter(BASE_DELAYS_MS[attempt] ?? 2000))
        continue
      }
      throw e
    }

    if (res.status === 429) {
      // Honor X-RateLimit-Reset if the server provides it. Header is in
      // seconds; we read the first value if it's a comma list.
      const resetHeader = res.headers.get("X-RateLimit-Reset")
      const resetSec = resetHeader ? Number(resetHeader.split(",")[0]) : NaN
      const waitMs = Number.isFinite(resetSec) && resetSec > 0
        ? Math.min(resetSec * 1000, 30_000) // cap at 30s
        : jitter(BASE_DELAYS_MS[attempt] ?? 2000)
      if (attempt < maxAttempts - 1) {
        await sleep(waitMs)
        continue
      }
    }

    if (res.status >= 500 && attempt < maxAttempts - 1) {
      await sleep(jitter(BASE_DELAYS_MS[attempt] ?? 2000))
      continue
    }

    const bodyText = await res.text()
    return {
      status: res.status,
      bodyText,
      etag: res.headers.get("ETag"),
    }
  }

  // Unreachable in practice (the loop always either returns or throws).
  throw lastNetworkError ?? new Error("fetchWithRetry: exhausted attempts")
}
