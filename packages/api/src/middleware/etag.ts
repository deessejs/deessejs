import type { MiddlewareHandler } from "hono"

/**
 * Weak ETag middleware for cacheable routes.
 *
 * Strategy: the ETag is a version counter (not a hash of the body). The
 * handler bumps the counter when the underlying data changes. Weak ETags
 * (W/"v3") signal that two equivalent representations of the same
 * resource may carry different byte sequences — acceptable for a
 * registry catalog where JSON formatting is stable.
 *
 * Why not a content hash:
 *   - SHA-256 of a 3-entry JSON array is wasted compute.
 *   - Version counters are debuggable: "the CDN serves v3, we shipped v4"
 *     is a sentence an on-call can say in their head.
 *   - The version is owned by the handler, not derived from the body, so
 *     two semantically-identical responses always share the same ETag.
 *
 * Behavior:
 *   - On request: read If-None-Match, compare (weak-aware) to the current
 *     version. If it matches, return 304 with no body and the same ETag.
 *   - On response: set ETag and Cache-Control: public, max-age=300,
 *     stale-while-revalidate=86400. The CDN absorbs the bulk of traffic;
 *     swr keeps the user-facing experience smooth when the cache expires.
 */
export const etag = (getVersion: () => string): MiddlewareHandler => {
  return async (c, next) => {
    await next()
    const version = getVersion()
    const tag = `W/"${version}"`

    const incoming = c.req.header("If-None-Match")
    if (incoming && weakMatch(incoming, tag)) {
      // 304 — drop the body, keep the headers Hono already set.
      c.res = new Response(null, {
        status: 304,
        headers: c.res.headers,
      })
      c.res.headers.set("ETag", tag)
      return
    }

    c.res.headers.set("ETag", tag)
    c.res.headers.set(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=86400",
    )
  }
}

/**
 * Weak-aware comparison: a request `If-None-Match: W/"v3"` matches a
 * response `ETag: W/"v3"`. Also accepts multiple comma-separated values
 * and tolerates strong ETag requests (no W/ prefix) for robustness.
 */
const weakMatch = (ifNoneMatch: string, etag: string): boolean => {
  const candidates = ifNoneMatch.split(",").map((s) => s.trim())
  return candidates.some((candidate) => {
    // Strip the W/ prefix on either side for comparison.
    const strip = (s: string) => s.replace(/^W\//, "")
    return strip(candidate) === strip(etag) || candidate === "*"
  })
}
