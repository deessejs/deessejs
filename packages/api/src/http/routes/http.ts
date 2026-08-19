import { sql } from "drizzle-orm"
import { auth } from "@workspace/auth"
import { db } from "@workspace/database"
import { serverEnv } from "@workspace/env/server"
import type { Hono } from "hono"
import { VERSION, MIN_SUPPORTED_VERSION } from "../../constants/version.js"
import type { ApiEnv } from "../env.js"
import { rateLimit } from "../middleware/rate-limit.js"

/**
 * Direct HTTP routes that do not go through oRPC:
 *   - `GET /health`    — liveness probe, no dependencies.
 *   - `GET /version`   — server version probe. Cached aggressively.
 *   - `GET /ready`     — readiness probe, pings Postgres.
 *   - `*  /auth/*`     — Better Auth handler (login, signup, ...).
 *
 * The oRPC router handles everything under `/rpc/*`. Adding a new
 * direct HTTP route is a deliberate choice (a non-RPC endpoint);
 * most things belong in `routes/templates.ts` and friends.
 */
export const mountHttp = (api: Hono<ApiEnv>): void => {
  // Liveness — cheap, always 200 unless the process is dead.
  api.get("/health", (c) =>
    c.json({ status: "ok", timestamp: new Date().toISOString() }),
  )

  // Server version probe — public, no auth, rate-limited. Cached
  // for 10 minutes because the values change only at release time.
  api.get(
    "/version",
    rateLimit(serverEnv.RATE_LIMIT_PER_MINUTE),
    (c) => {
      c.header(
        "Cache-Control",
        "public, max-age=600, stale-while-revalidate=86400",
      )
      return c.json({
        version: VERSION,
        minSupported: MIN_SUPPORTED_VERSION,
      })
    },
  )

  // Readiness — pings Postgres. db.execute throws on connection
  // failure (ECONNREFUSED, ETIMEDOUT, pool exhaustion); the catch
  // returns 503, the signal Kubernetes/LBs need to stop routing.
  api.get("/ready", async (c) => {
    try {
      await db.execute(sql`SELECT 1`)
      return c.json({ status: "ready" })
    } catch (err) {
      console.error("[ready-debug-2] db.execute failed:", err)
      return c.json({ status: "not ready" }, 503)
    }
  })

  // Better Auth — login, signup, session, etc.
  api.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw))
}
