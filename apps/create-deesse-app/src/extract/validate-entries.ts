import * as tar from "tar"

import { unsafeArchive } from "../errors/index.js"
import type { PlannedEntry } from "../result.js"
import { validateEntry, type Entry } from "./validate-entry.js"

export type ValidateEntriesArgs = {
  tarballPath: string
  /** Full 40-char commit SHA used to download the archive. */
  sha: string
  /** Repo name (e.g. "saas-template"). */
  repo: string
  /**
   * Optional signal forwarded to `tar.t`. When the signal
   * aborts, the in-flight read is interrupted and the
   * returned promise rejects. The pipeline translates that
   * to a `CreateFailure` with `error.code === "aborted"`.
   */
  signal?: AbortSignal
}

export type ValidateEntriesResult = {
  /**
   * The normalized, prefix-stripped entry list — one entry per
   * file the real extraction would have written to the
   * destination. Directory entries (mode indicating a directory
   * in tar's `typeflag` field) are NOT included: directories
   * are an extraction-side artifact and the dry-run plan
   * describes files the user will see, not intermediate
   * directory nodes.
   */
  entries: PlannedEntry[]
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
 *
 * On success, returns the normalized entry list. The dry-run
 * pipeline consumes this list to build its `plannedFiles`
 * field; the real-create pipeline ignores it (the same
 * information is reconstructed on disk by `extractTarball`).
 */
export const validateEntries = async (
  args: ValidateEntriesArgs
): Promise<ValidateEntriesResult> => {
  const { tarballPath, sha, repo, signal } = args
  const expectedPrefix = `${repo}-${sha}/`

  const failures: { path: string; reason: string }[] = []
  const seenNormalized = new Set<string>()
  const entries: PlannedEntry[] = []

  await tar.t({
    file: tarballPath,
    ...(signal !== undefined ? { signal } : {}),
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
        return
      }
      seenNormalized.add(normalized)

      // The top-level prefix entry has an empty path after
      // stripping. tar's read pass iterates that entry too;
      // it has no file content and would inflate
      // `plannedFiles` with a meaningless "" row.
      if (normalized.length === 0) {
        return
      }

      // tar entries for directories use typeflag "5" (or
      // mode bits 0o040000). The dry-run plan describes
      // files, not intermediate directories: real
      // extraction creates the parents implicitly, and a
      // directory entry in the plan would inflate the
      // `plannedFiles` count without telling the user
      // anything actionable.
      const isDirectory =
        (e as { typeflag?: string }).typeflag === "5" ||
        ((e.mode ?? 0) & 0o170000) === 0o040000
      if (isDirectory) {
        return
      }

      entries.push({
        path: normalized,
        size: typeof e.size === "number" ? e.size : 0,
        mode: typeof e.mode === "number" ? e.mode : 0,
      })
    },
  })

  if (failures.length > 0) {
    throw unsafeArchive(failures.map((f) => `${f.path}: ${f.reason}`))
  }
  return { entries }
}
