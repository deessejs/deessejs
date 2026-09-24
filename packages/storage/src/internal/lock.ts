/**
 * Atomic filesystem write.
 *
 * The pattern: write to a temp file in the same directory, then rename.
 * `rename` is atomic on POSIX (Linux, macOS) and on NTFS since Windows
 * 10 1809. If the process crashes mid-write, the destination is
 * either the old content or the new content — never partial.
 *
 * This is the same primitive used by:
 *   - `write-file-atomic` npm package
 *   - pnpm's `storeWriter`
 *   - cargo's filesystem operations
 *
 * We re-implement rather than depend on a package because the surface
 * is small (one function, one helper) and avoiding the dep keeps the
 * tree slim.
 */

import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"

export interface LockOptions {
  /** Override the suffix used for the temp file. Useful for tests. */
  suffix?: string
}

/**
 * Atomically write `data` to `target`. Returns when the rename
 * completes successfully.
 *
 * On failure, the temp file is cleaned up. The target file is never
 * left in a partially-written state.
 */
export async function lockWrite(
  target: string,
  data: string | Uint8Array,
  options: LockOptions = {},
): Promise<void> {
  const dir = path.dirname(target)
  const suffix =
    options.suffix ??
    `.tmp.${process.pid}.${crypto.randomBytes(6).toString("hex")}`
  const tmp = `${target}${suffix}`

  await fs.mkdir(dir, { recursive: true })
  try {
    await fs.writeFile(tmp, data)
    await fs.rename(tmp, target)
  } catch (err) {
    // Best-effort cleanup. We never fail on the cleanup itself —
    // a stale temp file is harmless and will be overwritten on the
    // next successful lockWrite to the same target.
    await fs.unlink(tmp).catch(() => undefined)
    throw err
  }
}
