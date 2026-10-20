import { createHash } from "node:crypto"

/**
 * Per-IP and per-email rate-limit primitives for oRPC procedures.
 *
 * Mirrors the Hono middleware at
 * `packages/api/src/http/middleware/rate-limit.ts`: same fixed-window,
 * same in-memory `Map`, same opportunistic cleanup, but shaped for
 * the oRPC handler signature (`Headers` in, `{ allowed }` verdict out,
 * never throws).
 *
 * V1 trade-offs (intentional, documented):
 *
 *   - In-memory store: counts are per Vercel instance. Effective
 *     limit is N_instances * limit. Acceptable at playbook signup
 *     volume (a few per day). Migrate to `@upstash/ratelimit`
 *     (sliding window on Upstash Redis / Vercel KV) when volume
 *     justifies the extra dependency, secret, and one-network-hop
 *     latency. Same TODO that already lives on
 *     `packages/api/src/http/middleware/rate-limit.ts`, both
 *     locations upgrade in one follow-up PR.
 *   - Fixed window: a client can burst at the boundary (e.g. 2 * limit
 *     in 2 seconds if they straddle a window). Sliding windows are
 *     more accurate but costlier and not necessary at this volume.
 *   - Source IP from `X-Forwarded-For`. Vercel overwrites the
 *     header at the edge, so it is trustworthy in production. If
 *     the deployment ever moves behind another ingress, sanitize
 *     the rightmost trusted hop instead of trusting the leftmost
 *     field.
 *
 * Never throws: returns a `{ allowed, ... }` discriminant.
 */

type Bucket = { count: number; resetAt: number }

const ipBuckets = new Map<string, Bucket>()
const emailBuckets = new Map<string, number>()
let totalRequests = 0

/**
 * Extract the first client IP from `X-Forwarded-For` (set by Vercel
 * at the edge). Falls back to `X-Real-IP`, then to the literal
 * "unknown" so a missing header never throws, it just buckets
 * every request together (worse than tracking per-IP, but better
 * than crashing).
 */
export const clientIp = (headers: Headers): string => {
  const xff = headers.get("x-forwarded-for")
  if (xff) {
    const first = xff.split(",")[0]?.trim()
    if (first) return first
  }
  const real = headers.get("x-real-ip")
  if (real) return real
  return "unknown"
}

/**
 * Hash a normalized email for use as an infra key. Never store raw
 * PII in the bucket map. SHA-256 is overkill for collision avoidance
 * at this volume but it is free, keeps the key fixed-length, and
 * lets us honestly claim "no PII in the in-memory store".
 */
const hashEmail = (email: string): string =>
  createHash("sha256").update(email.trim().toLowerCase()).digest("hex")

export interface LimitVerdict {
  allowed: boolean
  remaining: number
  resetSeconds: number
}

export interface DedupVerdict {
  allowed: boolean
  /** Milliseconds since the last submission with this email; -1 if none seen. */
  sinceLastMs: number
}

/**
 * Per-IP fixed-window rate limit. Mirrors the Hono middleware shape.
 */
export const checkIpLimit = (
  ip: string,
  limit = 5,
  windowMs = 60_000,
): LimitVerdict => {
  const now = Date.now()
  const windowStart = Math.floor(now / windowMs) * windowMs

  let bucket = ipBuckets.get(ip)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: windowStart + windowMs }
    ipBuckets.set(ip, bucket)
  }
  bucket.count += 1
  totalRequests += 1

  const remaining = Math.max(0, limit - bucket.count)
  const resetSeconds = Math.max(0, Math.ceil((bucket.resetAt - now) / 1000))

  // Same opportunistic cleanup cadence as the Hono middleware,
  // every 256 requests, evict expired buckets so the map stays
  // bounded under sustained traffic.
  if (totalRequests % 256 === 0) {
    for (const [key, b] of ipBuckets) {
      if (b.resetAt <= now) ipBuckets.delete(key)
    }
  }

  return {
    allowed: bucket.count <= limit,
    remaining,
    resetSeconds,
  }
}

/**
 * Per-email single-shot dedup. The contact can re-submit after the
 * window passes (default: 60s). Tighter than the IP limit, designed
 * to absorb accidental double-clicks and impatient retries without
 * blocking legitimate use.
 */
export const checkEmailDedup = (
  email: string,
  windowMs = 60_000,
): DedupVerdict => {
  const key = hashEmail(email)
  const now = Date.now()
  const lastSeenAt = emailBuckets.get(key)

  if (lastSeenAt && now - lastSeenAt < windowMs) {
    return {
      allowed: false,
      sinceLastMs: now - lastSeenAt,
    }
  }

  emailBuckets.set(key, now)

  if (totalRequests % 256 === 0) {
    const cutoff = now - windowMs
    for (const [k, seenAt] of emailBuckets) {
      if (seenAt <= cutoff) emailBuckets.delete(k)
    }
  }

  return {
    allowed: true,
    sinceLastMs: lastSeenAt ? now - lastSeenAt : -1,
  }
}
