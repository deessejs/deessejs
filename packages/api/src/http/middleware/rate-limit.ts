import type { Context, MiddlewareHandler } from "hono"
import { HTTPException } from "hono/http-exception"
import { logger } from "../../constants/logger.js"
import type { Bucket } from "./bucket.js"

/**
 * Per-IP fixed-window rate limiter (in-memory).
 *
 * V1 trade-offs (intentional, documented):
 *   - In-memory store: counts are per Vercel instance. Effective limit is
 *     N_instances * limit. Acceptable at current volume; migrate to a
 *     shared store (Upstash, Vercel KV) when the volume justifies the
 *     extra dependency, secret, and latency.
 *   - Fixed window: a client can burst at the boundary (e.g. 2 * limit
 *     requests in 2 seconds if they straddle a window). A sliding window
 *     is more accurate but costlier in memory and not necessary yet.
 *   - Source IP from `X-Forwarded-For` (Vercel sets it). Trusts the
 *     header because the catch-all sits behind Vercel's edge, which
 *     overwrites client-supplied values. If we ever expose this to other
 *     ingress, sanitize the header (take the rightmost trusted hop).
 *
 * Behavior:
 *   - On every request, increment the counter for the current minute.
 *   - If count > limit, throw an HTTPException 429 that the global
 *     onError maps to an ORPCError wire shape. The typed client
 *     decodes this as a real `ORPCError` with code `RATE_LIMITED`.
 *   - Opportunistic cleanup: every 256 requests, evict expired buckets
 *     to keep the map bounded.
 */
const buckets = new Map<string, Bucket>()
let totalRequests = 0

const clientIp = (c: Context): string => {
  // Vercel sets x-forwarded-for: "<client>, <proxy1>, <proxy2>". The
  // first entry is the original client IP.
  const xff = c.req.header("x-forwarded-for")
  if (xff) {
    const first = xff.split(",")[0]?.trim()
    if (first) return first
  }
  const real = c.req.header("x-real-ip")
  if (real) return real
  // Last resort: every request bucketed together. Better than crashing.
  return "unknown"
}

export const rateLimit = (limit: number): MiddlewareHandler => {
  return async (c, next) => {
    const ip = clientIp(c)
    const now = Date.now()
    const windowMs = 60_000
    const windowStart = Math.floor(now / windowMs) * windowMs

    let bucket = buckets.get(ip)
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: windowStart + windowMs }
      buckets.set(ip, bucket)
    }
    bucket.count += 1
    totalRequests += 1

    const remaining = Math.max(0, limit - bucket.count)
    const resetSeconds = Math.max(0, Math.ceil((bucket.resetAt - now) / 1000))

    c.header("X-RateLimit-Limit", String(limit))
    c.header("X-RateLimit-Remaining", String(remaining))
    c.header("X-RateLimit-Reset", String(resetSeconds))

    if (bucket.count > limit) {
      const requestId = c.get("requestId") ?? "unknown"
      logger.warn("rate_limited", {
        requestId,
        ip,
        method: c.req.method,
        path: c.req.path,
        limit,
      })
      // Throwing HTTPException lets the global onError map this to an
      // ORPCError wire shape so the typed client surfaces it as
      // `new ORPCError("RATE_LIMITED", { status: 429 })`. We attach
      // `retryAfter` as a property on the HTTPException so the onError
      // hook can read it; in practice the message carries the seconds
      // and the client computes the wait from there.
      throw new HTTPException(429, {
        message: `Too many requests. Try again in ${resetSeconds}s.`,
      })
    }

    if (totalRequests % 256 === 0) {
      for (const [key, b] of buckets) {
        if (b.resetAt <= now) buckets.delete(key)
      }
    }

    await next()
  }
}
