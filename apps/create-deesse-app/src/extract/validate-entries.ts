import * as tar from "tar"

import { unsafeArchive } from "../errors/index.js"
import { validateEntry, type Entry } from "./validate-entry.js"

export type ValidateEntriesArgs = {
  tarballPath: string
  /** Full 40-char commit SHA used to download the archive. */
  sha: string
  /** Repo name (e.g. "saas-template"). */
  repo: string
}

/**
 * Pass 1: read every entry in the tarball with `tar.t()` (the list/read
 * entry point) without writing anything. Reject the whole archive if:
 *
 *   - the entries do not share a single prefix `<repo>-<sha>/` (the
 *     Codeload archive uses the full 40-char SHA, not the 12-char
 *     short form, in its top-level directory name);
 *   - any entry is a symbolic link, special file, absolute path, contains
 *     `..` segments, or collides after normalization.
 *
 * `tar.t()` is read-only by design — it iterates entries without writing.
 * `tar.x()` writes; we keep the read pass separate so a malformed archive
 * cannot leave the destination in a half-written state.
 */
export const validateEntries = async (args: ValidateEntriesArgs): Promise<void> => {
  const { tarballPath, sha, repo } = args
  const expectedPrefix = `${repo}-${sha}/`

  const failures: { path: string; reason: string }[] = []
  const seenNormalized = new Set<string>()

  await tar.t({
    file: tarballPath,
    onentry: (entry) => {
      const e = entry as unknown as Entry
      // Prefix deviation.
      if (!e.path.startsWith(expectedPrefix)) {
        failures.push({
          path: e.path,
          reason: `entry does not start with expected prefix "${expectedPrefix}"`,
        })
        return
      }

      // Strip the prefix and re-validate.
      const stripped = e.path.slice(expectedPrefix.length)
      const result = validateEntry({ ...e, path: stripped })
      if (!result.ok) {
        failures.push(...result.failures)
        return
      }

      // Normalized collision check (post-strip, post-normalize).
      const normalized = stripped.replace(/\\/g, "/")
      if (seenNormalized.has(normalized)) {
        failures.push({
          path: e.path,
          reason: `normalized path collision with another entry (${normalized})`,
        })
      } else {
        seenNormalized.add(normalized)
      }
    },
  })

  if (failures.length > 0) {
    throw unsafeArchive(failures.map((f) => `${f.path}: ${f.reason}`))
  }
}