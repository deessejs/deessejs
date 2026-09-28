/**
 * Registry HTTP routes (REST, not oRPC).
 *
 * Three endpoints consumed by `@workspace/registry-client`:
 *
 *   - GET  /registry/catalog                       → { templates: CatalogEntry[] }
 *   - POST /registry/fetch-descriptor              → { descriptor, files }
 *   - GET  /registry/templates/:slug/info          → TemplateInfo
 *
 * Why REST and not oRPC:
 *   - The SDK uses `globalThis.fetch` with simple POST/GET. oRPC
 *     would require RPC-link plumbing on the client side, doubling
 *     the SDK surface for no consumer benefit.
 *   - These endpoints are read-mostly; the oRPC typing overhead
 *     is wasted.
 *   - Other Hono routes in this package (health, version, auth)
 *     follow the same REST pattern.
 *
 * Source strategy (V1):
 *   - The catalogue is served from a static `TEMPLATES` constant
 *     declared in `templates.ts`. No network call.
 *   - `fetch-descriptor` and `info` resolve the slug to a GitHub
 *     `owner/repo`, then read `deesse-template.json` from
 *     `raw.githubusercontent.com`. This is the V1 single-source
 *     strategy. R2 + auth-gated templates land in V2.
 *
 * Errors:
 *   - 404 when the slug is unknown.
 *   - 404 when the GitHub source returns 404 (the descriptor file
 *     doesn't exist yet for this template).
 *   - 502 when the upstream is unreachable / rate-limited.
 *   - 500 when the descriptor exists but fails Zod validation.
 */

import { TemplateV2Schema, type TemplateV2 } from "@workspace/contracts/v2"
import { logger } from "../../constants/logger.js"
import { TEMPLATES, type RegistryEntry } from "../../templates.js"
import type { ApiEnv } from "../env.js"
import type { Hono } from "hono"

/**
 * Resolve a slug to its registry entry. Returns `null` if the slug
 * is unknown. Used by all three endpoints below.
 */
const findEntry = (slug: string): RegistryEntry | null =>
  TEMPLATES.find((t) => t.slug === slug) ?? null

/**
 * Fetch `deesse-template.json` from GitHub raw for the given entry.
 *
 * Returns the raw text on success, or `null` if the upstream returns
 * 404. Network errors / non-404 upstream statuses are surfaced as
 * a thrown Error so the caller can translate to a 502.
 */
const fetchDescriptorFromGithub = async (
  entry: RegistryEntry,
  ref?: string,
): Promise<{ text: string; ref: string } | null> => {
  // The repo's `deesse-template.json` is conventionally at the
  // repo root. We don't yet encode the path in the registry entry
  // (that comes when descriptors are split per-template); for V1
  // we hard-code the canonical path.
  const url = `https://raw.githubusercontent.com/${entry.owner}/${entry.repo}/${ref ?? "main"}/deesse-template.json`
  const response = await fetch(url, {
    headers: { accept: "application/json" },
  })
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`GitHub responded ${response.status}`)
  }
  return { text: await response.text(), ref: ref ?? "main" }
}

/**
 * Convert an internal `RegistryEntry` into the SDK's
 * `CatalogEntry` wire shape.
 */
const toCatalogEntry = (entry: RegistryEntry) => ({
  slug: entry.slug,
  title: entry.name,
  ...(entry.description !== undefined ? { description: entry.description } : {}),
  layer: entry.layer,
  latestVersion: entry.version ?? "0.0.0",
})

/**
 * Mount the three registry HTTP routes on the given Hono app.
 */
export const mountRegistry = (api: Hono<ApiEnv>): void => {
  // -----------------------------------------------------------------
  // GET /registry/catalog
  // -----------------------------------------------------------------
  api.get("/registry/catalog", (c) => {
    const templates = TEMPLATES.map(toCatalogEntry)
    return c.json({ templates })
  })

  // -----------------------------------------------------------------
  // POST /registry/fetch-descriptor
  // -----------------------------------------------------------------
  api.post("/registry/fetch-descriptor", async (c) => {
    const body = await c.req.json().catch(() => null) as
      | { slug?: unknown; ref?: unknown }
      | null
    if (body === null || typeof body.slug !== "string") {
      return c.json({ error: "missing slug" }, 400)
    }
    const slug = body.slug
    const ref = typeof body.ref === "string" ? body.ref : undefined

    const entry = findEntry(slug)
    if (entry === null) {
      return c.json({ error: `unknown slug: ${slug}` }, 404)
    }

    let raw: { text: string; ref: string } | null
    try {
      raw = await fetchDescriptorFromGithub(entry, ref)
    } catch (cause) {
      logger.error("registry_fetch_failed", { slug, message: String(cause) })
      return c.json({ error: "upstream fetch failed" }, 502)
    }
    if (raw === null) {
      return c.json(
        { error: `descriptor not found for ${slug}` },
        404,
      )
    }

    let json: unknown
    try {
      json = JSON.parse(raw.text)
    } catch (cause) {
      logger.error("registry_invalid_descriptor", {
        slug,
        message: String(cause),
      })
      return c.json({ error: "descriptor is not valid JSON" }, 500)
    }

    const parsed = TemplateV2Schema.safeParse(json)
    if (!parsed.success) {
      logger.error("registry_invalid_descriptor", {
        slug,
        issues: parsed.error.issues,
      })
      return c.json({ error: "descriptor failed validation" }, 500)
    }

    const descriptor: TemplateV2 = parsed.data
    // Build URLs for each declared file at the resolved ref.
    const files: Record<string, string> = {}
    for (const file of descriptor.files ?? []) {
      files[file.path] = `https://raw.githubusercontent.com/${entry.owner}/${entry.repo}/${raw.ref}/${file.path}`
    }
    return c.json({ descriptor, files })
  })

  // -----------------------------------------------------------------
  // GET /registry/templates/:slug/info
  // -----------------------------------------------------------------
  api.get("/registry/templates/:slug/info", async (c) => {
    const slug = c.req.param("slug")
    if (typeof slug !== "string" || slug === "") {
      return c.json({ error: "missing slug" }, 400)
    }
    const entry = findEntry(slug)
    if (entry === null) {
      return c.json({ error: `unknown slug: ${slug}` }, 404)
    }

    // Pull the descriptor to extract versions / labels / etc.
    // Returns 503 if upstream is down — caller's `info()` returns
    // a RegistryNetworkError / RegistryFetchFailed in that case.
    let raw: { text: string; ref: string } | null
    try {
      raw = await fetchDescriptorFromGithub(entry)
    } catch (cause) {
      logger.error("registry_info_failed", {
        slug,
        message: String(cause),
      })
      return c.json({ error: "upstream fetch failed" }, 502)
    }

    // If GitHub returns 404, fall back to the static catalogue
    // entry. Better than returning an error — the consumer asked
    // for metadata, not the full descriptor.
    if (raw === null) {
      return c.json(toCatalogEntry(entry))
    }

    let json: unknown
    try {
      json = JSON.parse(raw.text)
    } catch {
      return c.json(toCatalogEntry(entry))
    }
    const parsed = TemplateV2Schema.safeParse(json)
    if (!parsed.success) {
      return c.json(toCatalogEntry(entry))
    }

    const d = parsed.data
    return c.json({
      slug: entry.slug,
      title: entry.name,
      ...(entry.description !== undefined
        ? { description: entry.description }
        : {}),
      layer: entry.layer,
      latestVersion: d.version,
      versions: [d.version],
      ...(d.labels !== undefined ? { labels: d.labels } : {}),
    })
  })
}
