/**
 * Runtime API URL resolution for the CLI.
 *
 * The CLI consumes an API that exposes two endpoint families:
 * - A version probe at `<base>/api/v1/version` (a Hono-direct route, per ADR-011).
 * - An ORPC endpoint at `<base>/api/v1/rpc` (the typed CLI client).
 *
 * Both endpoints are declared as path constants in `@workspace/api/base-path`.
 * The CLI cannot ship the path constants verbatim because `globalThis.fetch`
 * cannot resolve a relative URL in Node without a window. The CLI needs a
 * fully resolved absolute URL at request time.
 *
 * The resolution is:
 * 1. Read `API_BASE_URL` from the env at first call.
 * 2. Validate the URL is well-formed (URL-parseable, no whitespace).
 * 3. If env var is unset, fall back to the production default.
 * 4. Memoize the resolved base URL.
 *
 * The memoization is required for test determinism: tests that mount a
 * mock server per case do not want a stray env mutation to switch
 * servers mid-run.
 *
 * Implements ADR-014.
 */
const DEFAULT_API_BASE_URL = "https://deessejs.com"

const URL_RE = /^https?:\/\/[^/\s]+(:\d+)?(\/.*)?$/

let cachedBaseUrl: string | null = null

/**
 * Reset the memoized base URL. Tests call this between cases to
 * exercise the resolution path from scratch. Production code does
 * not call this.
 */
export const resetApiBaseUrlCache = (): void => {
  cachedBaseUrl = null
}

const validateBaseUrl = (raw: string): string => {
  const trimmed = raw.trim()
  if (trimmed === "") {
    throw new Error(
      "API_BASE_URL is set but empty. Unset it for the production default, or set a fully-qualified URL.",
    )
  }
  if (URL_RE.test(trimmed)) {
    return trimmed
  }
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(
        `API_BASE_URL must use http or https; got '${parsed.protocol}'.`,
      )
    }
    return parsed.toString().replace(/\/$/, "")
  } catch (err) {
    throw new Error(
      `API_BASE_URL is not a valid URL: '${raw}'. ` +
        "Expected an http(s) URL with no whitespace.",
    )
  }
}

/**
 * Return the resolved base URL. Reads `API_BASE_URL` from the env on the
 * first call, validates, and caches. Subsequent calls return the cached
 * value.
 *
 * Throws if the env var is set but malformed. Returns the production
 * default if the env var is unset.
 */
export const getApiBaseUrl = (): string => {
  if (cachedBaseUrl !== null) return cachedBaseUrl
  const raw = process.env.API_BASE_URL
  // Only the absence of the env var falls back to the default. An
  // explicitly set var (even empty) is a user error: the user
  // intended to override the URL and we should not silently fall
  // back. validateBaseUrl rejects empty and malformed values.
  cachedBaseUrl = raw === undefined ? DEFAULT_API_BASE_URL : validateBaseUrl(raw)
  return cachedBaseUrl
}

/**
 * Return the absolute URL for the ORPC endpoint.
 *
 * Concatenates the resolved base URL with the path constant. The path
 * constant is currently `/api/v1/rpc`; this function exists so this
 * concatenation is not duplicated across the CLI's call sites.
 */
export const getApiRpcUrl = (): string => `${getApiBaseUrl()}/api/v1/rpc`

/**
 * Return the absolute URL for the version probe system route.
 *
 * The version probe is a Hono-direct route (per ADR-011), not an ORPC
 * procedure. The path is `/api/v1/version`.
 */
export const getApiVersionUrl = (): string => `${getApiBaseUrl()}/api/v1/version`
