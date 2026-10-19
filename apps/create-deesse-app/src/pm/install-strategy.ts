import { unsupportedManager } from "../errors/index.js"

/**
 * The bootstrap used to run pnpm install. The choice is made at
 * runtime by `pickInstallStrategy` based on which of corepack,
 * npm, and pnpm are on the consumer's PATH.
 *
 *  - `corepack`    — `corepack pnpm install`. Reads the generated
 *                    project's `packageManager` field and downloads
 *                    pnpm at the version it declares. Default on
 *                    Node 22–24 where corepack ships with Node.
 *  - `npm-exec`    — `npm exec --yes -- pnpm@<version> install`.
 *                    Falls back to npm's cache when corepack is
 *                    absent (Node 25+). The version comes from
 *                    the generated project's `packageManager`
 *                    field.
 *  - `pnpm-direct` — `pnpm install`. Last-resort: a user has
 *                    pnpm on PATH but no corepack and no npm.
 *                    The version is not guaranteed to match the
 *                    generated project's `packageManager`.
 */
export type InstallStrategy = "corepack" | "npm-exec" | "pnpm-direct"

/**
 * Pick the install strategy from the three prereq flags. The
 * function is pure of `version`: the version is injected by the
 * command factory, not by this decision. Order is fixed:
 * corepack > npm-exec > pnpm-direct. If none are available,
 * throw `unsupported_manager` with a hint that names three
 * manual-install paths.
 */
export const pickInstallStrategy = (input: {
  corepackAvailable: boolean
  npmAvailable: boolean
  pnpmAvailable: boolean
}): InstallStrategy => {
  if (input.corepackAvailable) return "corepack"
  if (input.npmAvailable) return "npm-exec"
  if (input.pnpmAvailable) return "pnpm-direct"
  throw unsupportedManager("pnpm")
}
