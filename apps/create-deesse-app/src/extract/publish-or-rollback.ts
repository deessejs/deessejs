import { existsSync, rmSync } from "node:fs"
import { rename } from "node:fs/promises"
import { dirname } from "node:path"

import { destinationExists } from "../errors/index.js"

export type PublishOrRollbackArgs = {
  tempDir: string
  destination: string
  /** Optional temp tarball to clean up on best-effort basis. */
  tarballPath?: string
}

/**
 * Atomically rename the staged directory into the final destination.
 *
 * - If `destination` already exists (race with another process between
 *   `validateDestination` and now), the staged dir is removed and
 *   `destination_exists` is thrown. The user's filesystem is unchanged.
 * - If the rename fails for any other reason, the staged dir is removed
 *   and the original error is re-thrown.
 * - The downloaded tarball is best-effort removed on success.
 */
export const publishOrRollback = async (
  args: PublishOrRollbackArgs,
): Promise<void> => {
  const { tempDir, destination, tarballPath } = args

  // Ensure the parent of `destination` exists. (`rename` requires the parent.)
  const parent = dirname(destination)
  if (!existsSync(parent)) {
    rmSync(tempDir, { recursive: true, force: true })
    if (tarballPath) rmSync(tarballPath, { force: true })
    throw destinationExists(destination)
  }

  try {
    await rename(tempDir, destination)
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === "EEXIST" || code === "ENOTEMPTY") {
      rmSync(tempDir, { recursive: true, force: true })
      if (tarballPath) rmSync(tarballPath, { force: true })
      throw destinationExists(destination)
    }
    rmSync(tempDir, { recursive: true, force: true })
    if (tarballPath) rmSync(tarballPath, { force: true })
    throw err
  }

  // Best-effort tarball cleanup on success.
  if (tarballPath) {
    try {
      rmSync(tarballPath, { force: true })
    } catch {
      // ignore — tmpdir will eventually be cleaned by the OS
    }
  }
}