import { existsSync, mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

/**
 * On-disk response cache for the CLI.
 *
 * Layout: one file per endpoint under ~/.deessejs/. Each file holds the
 * raw response body plus the ETag the server returned, so we can reissue
 * If-None-Match on the next call and serve the cached body on a 304.
 *
 * No TTL: the server is the source of truth for freshness. A cache entry
 * is "valid" if either (a) we can revalidate it against the server and
 * the server says 304, or (b) we're in --offline mode and any prior
 * response is better than nothing.
 *
 * Corruption policy: a malformed file is treated as cache-miss. We do
 * not auto-overwrite it — if the user manually edited a cache file, we
 * surface that as a warning and let them decide. The next successful
 * network call will overwrite the file normally.
 */
export const CACHE_DIR = join(homedir(), ".deessejs")

export const ensureCacheDir = (): void => {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true })
  }
}

export const cachePath = (name: string): string => join(CACHE_DIR, name)
