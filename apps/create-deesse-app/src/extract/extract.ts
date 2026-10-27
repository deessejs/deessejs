import * as tar from "tar"

import { unsafeArchive } from "../errors/index.js"
import { validateEntry } from "./validate-entry.js"

// Safety is enforced by the two-pass pipeline: validate-entries.ts
// runs tar.t() read-only first and rejects any unsafe entry before
// this code path is reached; onReadEntry re-runs the same per-entry
// guard as defense-in-depth.

export type ExtractTarballArgs = {
  tarballPath: string
  /** Where to extract. Caller must have created it. */
  tempDir: string
  /** Full 40-char commit SHA used to download the archive. */
  sha: string
  /** Repo name (e.g. "saas-template"). */
  repo: string
  /**
   * Optional signal forwarded to `tar.x`. When the signal
   * aborts, the in-flight extraction is interrupted and the
   * returned promise rejects. The pipeline translates that
   * to a `CreateFailure` with `error.code === "aborted"`.
   */
  signal?: AbortSignal
}

/**
 * Pass 2: extract the tarball into `tempDir` with `tar.x({ strip: 1, ... })`.
 *
 * `tar.x` invokes the `onReadEntry` hook BEFORE writing each entry, but
 * with the **pre-strip** path — i.e. the entry's path still includes the
 * `<repo>-<sha>/` prefix. We strip the prefix here before re-running the
 * per-entry validator (defense-in-depth: pass 1 already validated).
 *
 * On any throw, `tempDir` is left for the caller's rollback to clean up.
 * The function does NOT call `fs.rmSync` itself.
 */
export const extractTarball = async (
  args: ExtractTarballArgs
): Promise<void> => {
  const { tarballPath, tempDir, sha, repo, signal } = args
  const expectedPrefix = `${repo}-${sha}/`

  const failures: { path: string; reason: string }[] = []

  await tar.x({
    file: tarballPath,
    cwd: tempDir,
    strip: 1,
    ...(signal !== undefined ? { signal } : {}),
    onReadEntry: (entry) => {
      // Confirm the archive is the one we asked for — every entry must
      // start with the expected prefix. If not, abort.
      if (!entry.path.startsWith(expectedPrefix)) {
        failures.push({
          path: entry.path,
          reason: `entry does not start with expected prefix "${expectedPrefix}"`,
        })
        return
      }
      // Strip the prefix, then run the same per-entry safety check.
      const stripped = entry.path.slice(expectedPrefix.length)
      const result = validateEntry({ ...entry, path: stripped })
      if (!result.ok) {
        failures.push(...result.failures)
      }
    },
  })

  if (failures.length > 0) {
    throw unsafeArchive(failures.map((f) => `${f.path}: ${f.reason}`))
  }
}
