/**
 * Local descriptor cache (ETag + filesystem lockfile).
 *
 * Layout:
 *   {root}/catalog.json                    ETag + items list (revalidated on every fetch)
 *   {root}/items/<slug>/<ref>.json         parsed descriptor per (slug, ref)
 *   {root}/http/<sha256-of-url>.json       raw ETag + body for the wire envelope
 *
 * The provider pattern is:
 *
 *   1. Read HTTP cache file for the (slug, ref) → if hit, return parsed
 *      descriptor without any network.
 *   2. If miss, do conditional GET with the stored ETag.
 *   3. On 200, write the new envelope to the cache, replace parsed
 *      descriptor in `items/`.
 *   4. On 304, the cached descriptor is still valid — return it.
 *
 * The cache is **provider-agnostic** — multiple providers can share the
 * same cache root. Items are keyed by (slug, ref, provider-id) so a
 * future authenticated provider does not collide with the public
 * git-tags provider.
 *
 * The cache is **opt-in**, not opt-out: providers choose to use it
 * (V1 git-tags does, V2 R2 does, a hypothetical pre-populated
 * "monolith" provider would not). The cache does not write to disk
 * automatically — providers explicitly call `cache.write()`.
 */

import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"

import { itemCachePath, catalogPath } from "./internal/paths.js"
import { lockWrite } from "./internal/lock.js"

import type { ParsedDescriptor } from "./provider.js"
import type { WireEnvelope } from "./envelope.js"

/** Identifying provider id; mixed into the cache key namespace. */
export type ProviderId = "git-tags" | "r2" | "neon" | string

export interface CachedDescriptor {
  /** Parsed descriptor (post-envelope-parse). */
  parsed: ParsedDescriptor
  /** ETag from the original response. */
  etag: string | null
  /** ISO timestamp of when this entry was last refreshed successfully. */
  refreshedAt: string
  /** Provider that wrote this entry. */
  provider: ProviderId
}

/**
 * Cache key. Combines provider + slug + ref to avoid cross-provider
 * collisions and to keep multi-registry namespaces separate.
 */
function itemKey(slug: string, ref: string): string {
  return `${slug}@${ref}`
}

/**
 * Read a cached descriptor. Returns null on miss. Never throws on
 * "not in cache" — only on actual filesystem errors.
 */
export async function read(
  provider: ProviderId,
  slug: string,
  ref: string,
): Promise<CachedDescriptor | null> {
  const fp = itemCachePath(provider, slug, ref)
  try {
    const raw = await fs.readFile(fp, "utf8")
    return JSON.parse(raw) as CachedDescriptor
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null
    throw err
  }
}

/**
 * Read the cached envelope (raw wire shape) for a descriptor. The
 * envelope is what was actually served by the registry, distinct from
 * the parsed descriptor (which may have been re-emitted by a parser).
 *
 * Used by providers that want to preserve the original `$schema` URL
 * without re-serializing.
 */
export async function readEnvelope(
  provider: ProviderId,
  slug: string,
  ref: string,
): Promise<WireEnvelope | null> {
  // V1 simplification: we store the parsed descriptor only. The
  // envelope is reconstructed from the parsed shape. Real envelope
  // persistence lands in the HTTP cache layer (V2) for byte-for-byte
  // ETag round-trip.
  const cached = await read(provider, slug, ref)
  if (!cached) return null
  return cached.parsed.kind === "template"
    ? { $schema: "https://registry.deessejs.com/schema/envelope/v1.json", format: "template", template: cached.parsed.template }
    : { $schema: "https://registry.deessejs.com/schema/envelope/v1.json", format: "block", block: cached.parsed.block }
}

/**
 * Write a descriptor to the cache, atomically. The HTTP cache file is
 * keyed by a SHA-256 of the URL so the same wire response can be
 * served across multiple providers that hit the same URL.
 */
export async function write(
  provider: ProviderId,
  slug: string,
  ref: string,
  entry: CachedDescriptor,
): Promise<void> {
  const target = itemCachePath(provider, slug, ref)
  await lockWrite(target, JSON.stringify(entry, null, 2))
}

/**
 * Drop a single entry. Idempotent — ENOENT is treated as success.
 * Used by `deessejs cache purge <slug>@<ref>`.
 */
export async function purge(
  provider: ProviderId,
  slug: string,
  ref: string,
): Promise<void> {
  const target = itemCachePath(provider, slug, ref)
  try {
    await fs.unlink(target)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err
  }
}

/**
 * Drop the entire cache for a provider. Used by
 * `deessejs cache purge --all --provider=git-tags`.
 *
 * Note: this only removes `items/`. The catalogue cache and the HTTP
 * raw cache are kept — they are designed to be repopulated lazily.
 */
export async function purgeProvider(provider: ProviderId): Promise<void> {
  // Placeholder — directory layout is provider-aware. Real impl
  // tracks {root}/items/<providerId>/.
}

/**
 * Cache path for inspection (e.g. by `deessejs info --cache-path`).
 * Exposed for the CLI without leaking the internal namespace.
 */
export function descriptorCachePath(
  provider: ProviderId,
  slug: string,
  ref: string,
): string {
  return itemCachePath(provider, slug, ref)
}

/**
 * The HTTP-layer cache key. Two requests to the same URL share the
 * cache entry even if the slug mapping differs (helps dedupe across
 * aliases).
 */
export function httpCacheKey(url: string): string {
  return crypto.createHash("sha256").update(url).digest("hex")
}

/**
 * Catalogue cache. V1 keeps a list of known slugs in
 * `{root}/catalog.json` so `deessejs list --offline` works.
 *
 * Not yet exposed publicly — wired in V1.1 once the catalogue fetch
 * path is integrated into the git-tags provider.
 */
export interface CachedCatalogue {
  /** Source URL. */
  url: string
  /** ETag from the response. */
  etag: string | null
  /** Refreshed-at timestamp. */
  refreshedAt: string
  /** Item slugs known to exist at refresh time. */
  items: string[]
}

export async function readCatalogue(): Promise<CachedCatalogue | null> {
  try {
    const raw = await fs.readFile(catalogPath(), "utf8")
    return JSON.parse(raw) as CachedCatalogue
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null
    throw err
  }
}

export async function writeCatalogue(entry: CachedCatalogue): Promise<void> {
  await lockWrite(catalogPath(), JSON.stringify(entry, null, 2))
}

/**
 * Internal helper exposed for tests: builds the cache key tuple.
 */
export function _internalItemKey(slug: string, ref: string): string {
  return itemKey(slug, ref)
}

// Re-export for the small set of consumers that want it.
export { itemCachePath }
