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
 */
export const readGeneratedPnpmVersion = (
  destinationDir: string,
): string => {
  const raw = readFileSync(join(destinationDir, "package.json"), "utf8")
  const parsed = JSON.parse(raw) as PkgJson
  const field = parsed.packageManager
  if (typeof field !== "string" || field.length === 0) {
    throw sourceFailed(
      "generated project's package.json has no packageManager field",
    )
  }
  // Accept "pnpm@<version>" with an optional "+sha" or "-rc" suffix
  // and any optional " <hash>" appended. pnpm itself is permissive
  // about the suffix; we only need the version segment.
  const m = /^pnpm@(\d+\.\d+\.\d+(?:[-+][^\s]+)?)/.exec(field)
  if (!m || m[1] === undefined) {
    throw sourceFailed(
      `generated project's packageManager field is "${field}"; expected "pnpm@<version>"`,
    )
  }
  return m[1]
}
