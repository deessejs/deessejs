import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs"

import { cachePath, ensureCacheDir } from "./location.js"

export type CacheEntry<T = unknown> = {
  etag: string | null
  fetchedAt: string
  body: T
}

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
