import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"

import { cachePath, ensureCacheDir } from "./location.js"

export type CacheEntry<T = unknown> = {
  etag: string | null
  fetchedAt: string
  body: T
}

export const RESPONSE_CACHE_TTL_MS = 5 * 60 * 1000
export const responseCacheKey = (name: string): string =>
  `response-v1-${name}.json`

export const readDiskCache = (name: string): CacheEntry<unknown> | null => {
  const path = cachePath(name)
  if (!existsSync(path)) return null
  try {
    const raw = readFileSync(path, "utf8")
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return null
    if (
      !("etag" in parsed) ||
      !("fetchedAt" in parsed) ||
      !("body" in parsed)
    ) {
      return null
    }
    if (typeof parsed.etag !== "string" && parsed.etag !== null) return null
    if (typeof parsed.fetchedAt !== "string") return null
    return {
      etag: parsed.etag,
      fetchedAt: parsed.fetchedAt,
      body: parsed.body,
    }
  } catch {
    // Corrupt or unreadable entries are misses; a later successful fetch can replace them.
    return null
  }
}

export const writeDiskCache = <T>(
  name: string,
  body: T,
  etag: string | null
): void => {
  ensureCacheDir()
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
    renameSync(tmp, target)
  } catch {
    writeFileSync(target, JSON.stringify(entry), "utf8")
  }
}

/** Remove response cache files only. Authentication state is stored separately. */
export const clearResponseCache = (): number => {
  const dir = cachePath("")
  if (!existsSync(dir)) return 0
  let removed = 0
  for (const name of readdirSync(dir)) {
    if (!name.startsWith("response-") || !name.endsWith(".json")) continue
    unlinkSync(cachePath(name))
    removed += 1
  }
  return removed
}
