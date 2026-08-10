/**
 * CLI version metadata served at /api/v1/cli-version.
 *
 * The CLI calls this on startup to warn the user when their installed
 * version is below `minSupported`. Version bump and `minSupported` bump
 * are both intentional: the first is a release, the second is a
 * deprecation signal.
 *
 * This is the only endpoint where the source of truth is *not* a runtime
 * value. The numbers are hand-synced from `apps/cli/package.json` and
 * the deployment plan. Bumping either number is a deliberate act, not
 * a side effect of a dependency update.
 */
export const CLI_VERSION = "2.0.0" as const
export const CLI_MIN_SUPPORTED = "2.0.0" as const
