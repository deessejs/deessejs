/**
 * Server version metadata served at /api/v1/version.
 *
 * The API does not know which consumer reads this endpoint.
 * Consumers that need to compare against a specific release
 * do so in their own docs, not by reading this file.
 *
 * This is the only endpoint where the source of truth is *not* a runtime
 * value. The numbers are hand-synced from the deployment plan.
 * Bumping either number is a deliberate act, not a side effect
 * of a dependency update.
 */
export const VERSION = "2.0.0" as const
export const MIN_SUPPORTED_VERSION = "2.0.0" as const
