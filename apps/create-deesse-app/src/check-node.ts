import { unsupportedNode } from "./errors/index.js"

/**
 * The minimum Node major version supported by this CLI. pnpm 11
 * ships its own version floor (>=22.13) and we honor it here.
 */
export const MIN_NODE_MAJOR = 22

/**
 * The minimum minor version for Node 22. pnpm 11.0.0 rejects
 * earlier 22.x minors in its runtime check; mirroring that
 * boundary at the CLI's startup keeps the error message in our
 * own voice rather than a downstream pnpm failure.
 */
export const MIN_NODE_22_MINOR = 13

/**
 * Parse a `process.versions.node`-shaped string (e.g. "v22.13.0"
 * or "22.13.0"; Node's `process.versions.node` does not include
 * the `v` prefix, while `process.version` does) into major/minor
 * numbers. Returns `null` for malformed input; the caller decides
 * what to do (the contract is "throw on bad input" for startup,
 * so a null here would itself be a startup error).
 */
const parseVersion = (
  version: string,
): { major: number; minor: number } | null => {
  // Accept an optional leading `v` to cover both `process.version`
  // ("v22.22.2") and `process.versions.node` ("22.22.2").
  const m = /^v?(\d+)\.(\d+)(?:\.\d+)?/.exec(version)
  if (!m || m[1] === undefined || m[2] === undefined) return null
  return { major: Number(m[1]), minor: Number(m[2]) }
}

/**
 * Assert that the given Node version is supported by this CLI.
 * Throws `unsupportedNode` with a clear message and the
 * required floor if the version is too old.
 *
 * The function takes the version as an argument (not as
 * `process.version`) so the unit test can pass any string
 * without resorting to runtime tricks on the global. The
 * default caller in `pipeline.ts` passes
 * `process.versions.node`.
 */
export const assertSupportedNode = (version: string): void => {
  const parsed = parseVersion(version)
  if (!parsed) {
    throw unsupportedNode(version, `${MIN_NODE_MAJOR}.${MIN_NODE_22_MINOR}`)
  }
  const { major, minor } = parsed
  if (major < MIN_NODE_MAJOR) {
    throw unsupportedNode(
      version,
      `${MIN_NODE_MAJOR}.${MIN_NODE_22_MINOR}`,
    )
  }
  if (major === MIN_NODE_MAJOR && minor < MIN_NODE_22_MINOR) {
    throw unsupportedNode(
      version,
      `${MIN_NODE_MAJOR}.${MIN_NODE_22_MINOR}`,
    )
  }
}
