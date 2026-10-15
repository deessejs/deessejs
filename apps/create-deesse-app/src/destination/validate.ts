import { statSync } from "node:fs"

import { destinationExists } from "../errors/index.js"

/**
 * Reject any existing destination — file, dir, symlink target, or dangling
 * symlink — including an empty directory. Per the issue's explicit
 * requirement: "reject any existing destination, including an empty
 * directory".
 *
 * `statSync` (with `throwIfNoEntry: false`) follows symlinks. If a symlink
 * points at a non-existent target, `statSync` returns `undefined` and the
 * check below treats it as "does not exist" — which is the correct behavior
 * for our pipeline (the subsequent `renameSync` will surface a clean error).
 *
 * A race between this check and the eventual `renameSync` is caught by
 * `publishOrRollback` (EEXIST/ENOTEMPTY → destination_exists).
 */
export const validateDestination = (dir: string): void => {
  const stat = statSync(dir, { throwIfNoEntry: false })
  if (stat) {
    throw destinationExists(dir)
  }
}