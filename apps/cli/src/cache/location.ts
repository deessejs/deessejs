import { existsSync, mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

/**
 * On-disk response cache for the CLI.
 *
 * Layout: one versioned response file per catalog or template detail under
 * ~/.deessejs/.
 *
 * Callers validate the body and its five-minute freshness before using it.
 * Expired, malformed or contract-invalid entries are misses.
 *
 * Corruption policy: a malformed file is treated as cache-miss. We do
 * not auto-overwrite it — if the user manually edited a cache file, we
 * surface that as a warning and let them decide. The next successful
 * network call will overwrite the file normally.
 *
 * The home directory is read lazily on each call to `cacheDir` so that
 * tests can override `HOME` / `USERPROFILE` between calls and pick up
 * the new value. Computing CACHE_DIR at module load time would freeze
 * the path on whatever os.homedir() returns when this file is first
 * imported, which makes integration testing impossible.
 */

/**
 * Return the cache directory, computed at call time so the
 * process.env.HOME / USERPROFILE override pattern works
 * in tests.
 */
export const cacheDir = (): string => join(homedir(), ".deessejs")

export const ensureCacheDir = (): void => {
  const dir = cacheDir()
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

/**
 * Absolute path to a file under the cache directory.
 * Computed at call time (no module-level capture) so tests
 * can override HOME / USERPROFILE and have the path
 * recomputed on the next invocation.
 */
export const cachePath = (name: string): string => join(cacheDir(), name)
