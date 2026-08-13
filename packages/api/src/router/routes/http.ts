import { sql } from "drizzle-orm"
import { auth } from "@workspace/auth"
import { db } from "@workspace/database"
import { serverEnv } from "@workspace/env/server"
import type { Hono } from "hono"
import { CLI_VERSION, CLI_MIN_SUPPORTED } from "../../cli-version.js"
import { rateLimit } from "../../middleware/rate-limit.js"
import type { ApiEnv } from "../../types/api-env.js"

/**
 * Direct HTTP routes that do not go through oRPC:
 *   - `GET /health`    — liveness probe, no dependencies.
 *   - `GET /cli-version` — CLI startup probe. Cached aggressively.
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

  // CLI version probe — public, no auth, rate-limited. Cached for
  // 10 minutes because the values change only at release time.
  // CLI 2.0.0+ calls this on startup to warn about outdated installs.
  api.get(
    "/cli-version",
    rateLimit(serverEnv.RATE_LIMIT_PER_MINUTE),
    (c) => {
      c.header(
        "Cache-Control",
        "public, max-age=600, stale-while-revalidate=86400",
      )
      return c.json({
        version: CLI_VERSION,
        minSupported: CLI_MIN_SUPPORTED,
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
    } catch {
      return c.json({ status: "not ready" }, 503)
    }
  })

  // Better Auth — login, signup, session, etc.
  api.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw))
}
