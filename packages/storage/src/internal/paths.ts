/**
 * Filesystem paths for the on-disk cache.
 *
 * Convention:
 *   - Linux/macOS: `$XDG_CACHE_HOME/deessejs` or `~/.cache/deessejs`
 *   - Windows: `%LOCALAPPDATA%\deessejs`
 *
 * Per-instance layout (provider-namespaced):
 *
 *   {root}/
 *     catalog.json                              catalogue ETag + items list
 *     items/<provider>/<slug>/<ref>.json        per-provider per-item cache
 *     http/<sha256-of-url>.bin                  shared raw HTTP cache (V2+)
 *
 * The provider namespace avoids cross-provider collisions: an item
 * fetched from git-tags and the same item fetched later from R2 are
 * cached independently.
 */

import os from "node:os"
import path from "node:path"

export function cacheRoot(): string {
  if (process.platform === "win32") {
    const local = process.env.LOCALAPPDATA
    if (local) return path.join(local, "deessejs")
    return path.join(os.homedir(), "AppData", "Local", "deessejs")
  }
  const xdg = process.env.XDG_CACHE_HOME
  if (xdg) return path.join(xdg, "deessejs")
  return path.join(os.homedir(), ".cache", "deessejs")
}

export function catalogPath(root = cacheRoot()): string {
  return path.join(root, "catalog.json")
}

/**
 * Cache path for a (provider, slug, ref) triple. The provider is part
 * of the path so multi-provider deployments don't trample each other.
 */
export function itemCachePath(
  provider: string,
  slug: string,
  ref: string,
  root = cacheRoot(),
): string {
  return path.join(
    root,
    "items",
    provider,
    slug,
    `${encodeURIComponent(ref)}.json`,
  )
}

export function httpCacheRoot(root = cacheRoot()): string {
  return path.join(root, "http")
}
