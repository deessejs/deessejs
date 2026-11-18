import {
  CLI_PACKAGE_NAME,
  NPM_REGISTRY_URL,
  STABLE_DIST_TAG,
  STABLE_VERSION_PATTERN,
} from "./constants.js"
import type { UpdateCheckErrorCode } from "./types.js"

export class UpdateCheckError extends Error {
  readonly code: UpdateCheckErrorCode

  /**
   * Creates an update-check error with a code callers can serialize without
   * exposing arbitrary implementation details.
   *
   * @param code - Distinguishes registry access failures from invalid metadata.
   * @param message - Actionable explanation safe for CLI diagnostics.
   */
  constructor(code: UpdateCheckErrorCode, message: string) {
    super(message)
    this.name = "UpdateCheckError"
    this.code = code
  }
}

/**
 * Fetches and validates the stable CLI version from the npm registry's
 * `latest` dist-tag. Network and HTTP failures are distinguished from malformed
 * metadata so callers can provide useful machine-readable error codes.
 *
 * @param fetcher - Injectable Fetch-compatible function; defaults to global
 * `fetch` and is replaceable in tests.
 * @returns A stable `X.Y.Z` version suitable for comparison with the bundled
 * package version.
 * @throws {UpdateCheckError} With `registry_error` for transport/HTTP failures
 * or `invalid_registry_response` for invalid JSON or version metadata.
 */
export const fetchLatestStableCliVersion = async (
  fetcher: typeof fetch = fetch
): Promise<string> => {
  let response: Response
  try {
    response = await fetcher(
      `${NPM_REGISTRY_URL}/${CLI_PACKAGE_NAME}/${STABLE_DIST_TAG}`
    )
  } catch (error) {
    throw new UpdateCheckError(
      "registry_error",
      `Could not reach the npm registry: ${error instanceof Error ? error.message : String(error)}`
    )
  }
  if (!response.ok) {
    throw new UpdateCheckError(
      "registry_error",
      `The npm registry returned HTTP ${response.status}.`
    )
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new UpdateCheckError(
      "invalid_registry_response",
      "The npm registry returned invalid JSON for the latest stable version."
    )
  }
  const version = parseStableVersion(body)
  if (!version) {
    throw new UpdateCheckError(
      "invalid_registry_response",
      "The npm registry response did not contain a stable X.Y.Z version."
    )
  }
  return version
}

/**
 * Parses the untrusted npm response body into a stable version. Prerelease
 * strings and missing/non-string fields are rejected because this lookup is
 * intentionally bound to the stable channel.
 *
 * @param value - JSON-decoded registry response of unknown shape.
 * @returns The validated version, or `null` when the response is unsuitable.
 */
const parseStableVersion = (value: unknown): string | null => {
  if (typeof value !== "object" || value === null || !("version" in value)) {
    return null
  }
  return typeof value.version === "string" &&
    STABLE_VERSION_PATTERN.test(value.version)
    ? value.version
    : null
}

/**
 * Compares two already-validated stable semantic versions without a runtime
 * dependency. The numeric tuple comparison avoids lexicographic mistakes such
 * as treating `3.10.0` as older than `3.9.0`.
 *
 * @param a - Stable `X.Y.Z` version.
 * @param b - Stable `X.Y.Z` version.
 * @returns A negative number when `a < b`, zero when equal, positive when `a > b`.
 */
export const compareStableCliVersions = (a: string, b: string): number => {
  const left = a.split(".").map(Number)
  const right = b.split(".").map(Number)
  for (let index = 0; index < 3; index++) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}
