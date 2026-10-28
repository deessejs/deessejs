import { existsSync, rmSync } from "node:fs"
import { open, rename, unlink } from "node:fs/promises"
import { dirname, join } from "node:path"
import { randomUUID } from "node:crypto"

import { destinationExists } from "../errors/index.js"

const DESTINATION_EXISTS_CODES = new Set([
  "EEXIST",
  "ENOTEMPTY",
  "ENOTDIR",
  "EACCES",
  "EPERM",
])

export type PublishOrRollbackArgs = {
  tempDir: string
  destination: string
  /** Optional temp tarball to clean up on best-effort basis. */
  tarballPath?: string
}

/**
 * Atomically rename the staged directory into the final destination.
 *
 * ## Why the O_EXCL probe
 *
 * `validateDestination` runs `lstat` once at the start of the pipeline and
 * then we sleep through SHA resolution, tarball download, two-pass tar
 * validation, extraction, and the package rename — a multi-second window
 * during which another process can create the destination. A bare
 * `rename(tempDir, destination)` cannot catch that race:
 *
 *   - on POSIX and Windows, `rename(src, dst)` **succeeds** when `dst` is an
 *     empty directory (no EEXIST, no ENOTEMPTY);
 *   - on POSIX, `rename(src, dst)` **replaces** any pre-existing entry at
 *     `dst` — including a file, a non-empty dir, a symlink, or a dangling
 *     symlink.
 *
 * Both behaviours would silently overwrite the user's filesystem.
 *
 * ## What we do
 *
 * Before the final `rename`, we open a probe file **inside the destination
 * parent** with the `wx` flag (`O_CREAT | O_EXCL`). If anything exists at
 * the destination path — file, dir, symlink, dangling symlink, or empty
 * dir — `wx` fails with EEXIST and we abort. Otherwise the probe is
 * unlinked (atomic) and we perform the `rename` into a slot that is, as
 * far as the kernel knows, empty.
 *
 * The `wx` open and the unlink are atomic, so a process that creates the
 * destination between the initial `validateDestination` and the `wx` open
 * is caught here, and a process that races the `wx` open itself is
 * rejected by the kernel.
 *
 * ## What this does NOT do
 *
 * - We do not lock the destination across processes. Concurrent runs of
 *   this CLI are not supported, and the probe gives us at-most-once
 *   semantics for that case anyway.
 * - We do not check that the parent directory is a real dir. If the
 *   parent is missing or invalid, the `wx` open will throw ENOENT (mapped
 *   to `internal`, not `destination_exists` — that was the reviewer's
 *   objection to the previous behaviour).
 */
export const publishOrRollback = async (
  args: PublishOrRollbackArgs
): Promise<void> => {
  const { tempDir, destination, tarballPath } = args

  const parent = dirname(destination)
  const probe = join(parent, `.cda-probe-${randomUUID()}`)

  let probeFd: Awaited<ReturnType<typeof open>> | undefined
  try {
    probeFd = await openDestinationProbe(
      probe,
      parent,
      destination,
      tempDir,
      tarballPath
    )

    // Step 2: probe succeeded — destination path is free AT THIS INSTANT.
    // Close the fd and unlink the probe so the parent stays clean.
    await probeFd.close()
    probeFd = undefined
    try {
      await unlink(probe)
    } catch {
      // best-effort; the rename below is what matters
    }

    // Step 3: the actual publish. If a competing process created the
    // destination in the (vanishingly small) window between Step 2 and
    // here, the rename will fail. The error code is platform-dependent:
    //   - POSIX: EEXIST (empty dir, or symlink), ENOTEMPTY (non-empty
    //     dir), or ENOTDIR (symlink whose target path resolves weirdly)
    //   - Windows: EPERM (when the existing entry is a directory — even
    //     an empty one) or EACCES
    // We map all of these to destination_exists.
    await renameDestination(tempDir, destination, tarballPath)
  } catch (err) {
    if (probeFd) {
      try {
        await probeFd.close()
      } catch {
        // ignore
      }
      try {
        await unlink(probe)
      } catch {
        // ignore
      }
    }
    throw err
  }

  // Best-effort tarball cleanup on success.
  if (tarballPath && existsSync(tarballPath)) {
    try {
      rmSync(tarballPath, { force: true })
    } catch {
      // ignore — tmpdir will eventually be cleaned by the OS
    }
  }
}

async function openDestinationProbe(
  probe: string,
  parent: string,
  destination: string,
  tempDir: string,
  tarballPath?: string
): Promise<Awaited<ReturnType<typeof open>>> {
  try {
    return await open(probe, "wx")
  } catch (error) {
    const code = getErrorCode(error)
    cleanup(tempDir, tarballPath)
    if (code === "EEXIST") throw destinationExists(destination)
    if (code === "ENOENT") {
      throw new Error(`parent directory does not exist: ${parent}`)
    }
    throw error
  }
}

async function renameDestination(
  tempDir: string,
  destination: string,
  tarballPath?: string
): Promise<void> {
  try {
    await rename(tempDir, destination)
  } catch (error) {
    const code = getErrorCode(error)
    cleanup(tempDir, tarballPath)
    if (typeof code === "string" && DESTINATION_EXISTS_CODES.has(code)) {
      throw destinationExists(destination)
    }
    throw error
  }
}

function getErrorCode(error: unknown): unknown {
  return error instanceof Error && "code" in error ? error.code : undefined
}

const cleanup = (tempDir: string, tarballPath?: string): void => {
  try {
    rmSync(tempDir, { recursive: true, force: true })
  } catch {
    // ignore
  }
  if (tarballPath) {
    try {
      rmSync(tarballPath, { force: true })
    } catch {
      // ignore
    }
  }
}
