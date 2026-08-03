import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
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
export type CacheEntry<T = unknown> = {
  etag: string | null
  fetchedAt: string
  body: T
}

export const CACHE_DIR = join(homedir(), ".deessejs")

const ensureDir = (): void => {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true })
  }
}

const cachePath = (name: string): string => join(CACHE_DIR, name)

export const readDiskCache = <T>(name: string): CacheEntry<T> | null => {
  const path = cachePath(name)
  if (!existsSync(path)) return null
  try {
    const raw = readFileSync(path, "utf8")
    return JSON.parse(raw) as CacheEntry<T>
  } catch {
    // Corrupt or unreadable. Caller logs a warning; we don't overwrite.
    return null
  }
}

export const writeDiskCache = <T>(
  name: string,
  body: T,
  etag: string | null,
): void => {
  ensureDir()
  const entry: CacheEntry<T> = {
    etag,
    fetchedAt: new Date().toISOString(),
    body,
  }
  // Write atomically via a temp file + rename to avoid torn writes
  // if the process is killed mid-write. tmp + rename is atomic on
  // POSIX; on Windows it's "atomic if the destination exists", which
  // is good enough for our use case.
  const target = cachePath(name)
  const tmp = `${target}.tmp`
  writeFileSync(tmp, JSON.stringify(entry), "utf8")
  // Best-effort rename. If it fails (rare on Windows), fall back to direct write.
  try {
    require("node:fs").renameSync(tmp, target)
  } catch {
    writeFileSync(target, JSON.stringify(entry), "utf8")
  }
}
