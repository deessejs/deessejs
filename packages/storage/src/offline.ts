/**
 * Offline-mode detection.
 *
 * Per ADR-033 §171, the CLI must not make outbound HTTP in CI. This
 * module centralises the detection so providers don't roll their own
 * env-var checks (which leads to drift across implementations).
 *
 * Detection rules (any of these triggers offline mode):
 *   - `process.env.CI === "true"`             — GitHub Actions, GitLab CI, etc.
 *   - `process.env.DEESSE_OFFLINE === "true"`  — explicit override
 *
 * `--no-offline` or `DEESSE_OFFLINE=false` can disable the override
 * (useful when debugging CI locally). The `process.env.CI` rule is
 * hard — there is no flag to override it.
 */

export interface OfflineContext {
  /** True iff the current process should refuse outbound HTTP. */
  readonly offline: boolean
  /** Why offline mode is active (for the error message). */
  readonly reason?: "ci" | "explicit"
}

/**
 * Detect offline mode. Pure function, no I/O — cheap to call on every
 * fetch.
 */
export function detectOffline(): OfflineContext {
  if (process.env.CI === "true") {
    return { offline: true, reason: "ci" }
  }
  if (
    process.env.DEESSE_OFFLINE === "true" &&
    process.env.DEESSE_OFFLINE_OFF !== "true"
  ) {
    return { offline: true, reason: "explicit" }
  }
  return { offline: false }
}
