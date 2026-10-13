import { sql } from "drizzle-orm"
import { auth } from "@workspace/auth"
import { isDefaultCreator } from "@workspace/auth/organization-policy"
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
    } catch {
      return c.json({ status: "not ready" }, 503)
    }
  })

  // Better Auth — login, signup, session, etc.
  //
  // Intercept `POST /api/v1/auth/organization/leave` BEFORE the
  // plugin handler runs, because the better-auth organization
  // plugin's `leaveOrganization` route does NOT call
  // `beforeRemoveMember` (its source is `routes/crud-members.mjs`
  // line ~390). The creator-must-stay-owner invariant (RFC-001 §5
  // "Protect the creator's owner membership in that organization")
  // would otherwise be unenforced for the leave path.
  //
  // A signed-in caller is identified by their session cookie; the
  // body's `organizationId` is the org they intend to leave. We
  // look up the user from the session via `auth.api.getSession`
  // and call `isDefaultCreator` to detect the
  // `(creator, default-org)` pair. A 403 is returned on match;
  // otherwise the request falls through to the plugin handler.
  api.post("/auth/organization/leave", async (c) => {
    let organizationId: unknown
    try {
      const cloned = c.req.raw.clone()
      const body = (await cloned.json()) as { organizationId?: unknown }
      organizationId = body.organizationId
    } catch {
      // Body is not JSON or is empty; let the plugin reject it.
      return auth.handler(c.req.raw)
    }
    if (typeof organizationId !== "string" || organizationId === "") {
      return auth.handler(c.req.raw)
    }
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })
    if (!session?.user) {
      return auth.handler(c.req.raw)
    }
    const creator = await isDefaultCreator(session.user.id, organizationId)
    if (creator) {
      return c.json(
        {
          error: {
            code: "FORBIDDEN",
            message:
              "The creator's owner membership in the default organization cannot be left.",
          },
        },
        403,
      )
    }
    return auth.handler(c.req.raw)
  })

  // Better Auth — everything else (login, signup, session, ...).
  api.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw))
}
