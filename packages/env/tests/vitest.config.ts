import { vitestConfig } from "@workspace/vitest-config"

/**
 * Vitest config for the env package's unit test suite.
 *
 * Uses the shared `@workspace/vitest-config` preset (ADR-009
 * section 70-72). The preset pins `include`, `setupFiles`,
 * `pool`, `timeouts`, and the coverage gate; this file does
 * not override any of those defaults — the env package is
 * load-bearing enough that the shared defaults apply as-is.
 */
export default vitestConfig()