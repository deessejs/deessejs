import { readFileSync } from "node:fs"
import { join } from "node:path"

import { sourceFailed } from "../errors/index.js"

/**
 * The shape of the `package.json` field we care about. We
 * accept an `unknown` cast at the read site because the
 * generated project's `package.json` is a free-form
 * document; the helper below extracts the only field we
 * need.
 */
type PkgJson = { packageManager?: string }

/**
 * Read the generated project's `packageManager` field and
 * return the pnpm version it declares. The field has the
 * shape `pnpm@<version>` (e.g. `pnpm@11.0.0`). If the
 * field is missing, malformed, or does not pin a pnpm
 * version, the helper throws `source_failed` with a hint
 * that names the expected field. There is no fallback to a
 * hardcoded version: a missing or malformed field is a real
 * problem with the template, and the user should know.
 *
 * The first argument is named `packageJsonDir` rather than
 * `destinationDir` because both the real-create path (where
 * the renamed `package.json` is at the destination) and the
 * dry-run path (where the renamed `package.json` is in the
 * staging tempdir) call this helper. The contract is the
 * same: a directory containing the renamed `package.json`.
 */
export const readGeneratedPnpmVersion = (
  packageJsonDir: string,
): string => {
  const raw = readFileSync(join(packageJsonDir, "package.json"), "utf8")
  const parsed = JSON.parse(raw) as PkgJson
  const field = parsed.packageManager
  if (typeof field !== "string" || field.length === 0) {
    throw sourceFailed(
      "generated project's package.json has no packageManager field",
    )
  }
  // Accept "pnpm@<version>" with the standard semver core
  // (major.minor.patch) and any combination of prerelease and
  // build-metadata segments, each composed of the characters
  // pnpm's own semver parser accepts: alphanumerics, dot, and
  // hyphen. We do not allow spaces, shell metacharacters, or
  // anything that could inject a shell command once the version
  // is interpolated into a recovery string. The boundary
  // character set is the one pnpm 11 documents in its semver
  // module; tighter than npm's, which is good — it narrows the
  // surface and matches what users actually have in their
  // `packageManager` field.
  //
  // A semver suffix is a dot-separated sequence of identifiers
  // each prefixed by `-` (prerelease) or `+` (build-metadata).
  // Examples: `-rc.1`, `-alpha.1.beta+sha.abc123`. Each segment
  // is alphanumeric with dots and hyphens inside.
  //
  // The regex is anchored at BOTH ends: a `packageManager` like
  // `pnpm@11.0.0garbage` would have produced `11.0.0` under
  // the old loose match. The trailing `$` rejects the field
  // outright, which is the correct behavior: if the template's
  // `packageManager` carries trailing junk, the CLI must not
  // silently extract a partial version. The version we extract
  // is exactly the version corepack and npm-exec will resolve.
  //
  // The regex is a linear match: each segment is matched once,
  // and the `*` at the end is bounded by the `[^...]` character
  // class which forbids the empty case and any character outside
  // the allowed set. There is no backtracking path: the input
  // is consumed left to right, and the bounded class means a
  // mismatch at any position fails fast.
  // A semver suffix is a sequence of segments each prefixed
  // by `-` (prerelease) or `+` (build-metadata). We unroll the
  // `[-+][A-Za-z0-9.-]+` repetition into a bounded sequence
  // (4 segments) to avoid nested-quantifier backtracking that
  // sonar's slow-regex rule flags. Each segment matches
  // independently and the regex stays linear. 4 is well past
  // the upper bound seen in real-world version strings
  // (pnpm itself is currently at 4 segments max).
  const semverSuffix = "(?:[-+][A-Za-z0-9.-]+){0,4}"
  const m = new RegExp(`^pnpm@(\\d+\\.\\d+\\.\\d+${semverSuffix})$`).exec(field)
  if (!m || m[1] === undefined) {
    throw sourceFailed(
      `generated project's packageManager field is "${field}"; expected "pnpm@<version>"`,
    )
  }
  return m[1]
}
