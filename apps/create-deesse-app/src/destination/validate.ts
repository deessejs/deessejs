import { lstatSync } from "node:fs"

import { destinationExists } from "../errors/index.js"

/**
 * Reject any existing destination — file, dir, symlink, or dangling symlink —
 * including an empty directory. Per the issue's explicit requirement:
 * "reject any existing destination, including an empty directory".
 *
 * Uses `lstatSync` (NOT `statSync`) so the entry itself is inspected, not
 * the target of any symlink. A symlink — even one pointing at a
 * non-existent path — has a valid `lstat` result and is rejected here. With
 * `statSync` the symlink would be followed and a dangling link would be
 * indistinguishable from "destination does not exist", which is the bug the
 * senior review caught.
 *
 * A race between this check and the eventual `rename` in
 * `publishOrRollback` is closed by the O_EXCL probe there, not by retrying
 * here.
 */
export const validateDestination = (dir: string): void => {
  const stat = lstatSync(dir, { throwIfNoEntry: false })
  if (stat) {
    throw destinationExists(dir)
  }
}
