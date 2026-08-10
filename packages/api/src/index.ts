import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger as honoLogger } from "hono/logger"
import { secureHeaders } from "hono/secure-headers"
import { sql } from "drizzle-orm"
import { auth } from "@workspace/auth"
import { onError } from "@orpc/server"
import { RPCHandler } from "@orpc/server/fetch"
import { db } from "@workspace/database"
import { serverEnv } from "@workspace/env/server"
import { appRouter } from "./router/index.js"
import { API_BASE_PATH } from "./base-path.js"
import { logger } from "./logger.js"
import { requestId, REQUEST_ID_HEADER } from "./middleware/request-id.js"
import { onError as onApiError } from "./middleware/error-handler.js"
import { rateLimit } from "./middleware/rate-limit.js"
import { CLI_VERSION, CLI_MIN_SUPPORTED } from "./cli-version.js"
import { errorBody } from "./envelope.js"

// Body parser methods that consume the request body. The proxy below
// redirects these to Hono's parsed getters so oRPC never sees a drained
// stream. Per https://orpc.dev/docs/adapters/hono — "Body Already Used".
const BODY_PARSER_METHODS = new Set([
  "arrayBuffer",
  "blob",
  "formData",
  "json",
  "text",
] as const)
type BodyParserMethod = (typeof BODY_PARSER_METHODS extends Set<infer T> ? T : never)

// Shared Hono Variables: populated by the session middleware below so
// downstream middleware and oRPC context can read `user`/`session` without
// re-issuing `auth.api.getSession({ headers })` per procedure.
export type ApiEnv = {
  Variables: {
    requestId: string
    user: NonNullable<
      Awaited<ReturnType<typeof auth.api.getSession>>
    >["user"] | null
    session: NonNullable<
      Awaited<ReturnType<typeof auth.api.getSession>>
    >["session"] | null
  }
}

// Catch-all is mounted at /api/[[...route]] in apps/app/app/api/[[...route]]/route.ts,
// so all incoming requests have an /api prefix. `API_BASE_PATH` (from ./base-path.js)
// is the single source of truth — Hono routes below are registered *relative* to it
// (e.g. `/health` matches `/api/v1/health`). Renaming the prefix means editing
// API_BASE_PATH in base-path.ts and moving the Next.js catch-all directory.
const api = new Hono<ApiEnv>().basePath(API_BASE_PATH)

// Global error handler — runs first so any error from a downstream handler
// is funnelled into a stable JSON envelope. Must be set before any
// middleware that might throw.
api.onError(onApiError)

// Request ID — first non-error hook. Generates a fresh UUID per request
// (or honours the incoming `X-Request-Id` for cross-system correlation),
// stores it in c.var.requestId, and echoes it on the response.
api.use("*", requestId())

// Security headers — `secureHeaders()` from Hono sets HSTS, nosniff,
// Referrer-Policy, X-Frame-Options, and a sensible default CSP. Cheap
// hardening, applied to every response including 404s.
api.use("*", secureHeaders())

// CORS middleware (single source of truth, validated at the env-package boundary)
api.use(
  "*",
  cors({ origin: serverEnv.ALLOWED_ORIGINS, credentials: true }),
)

// Logging middleware — Hono's default short logger, augmented by our
// structured logger in the error handler. The requestId from the previous
// step is included by the global error handler when something throws.
api.use("*", honoLogger())

// Session middleware — runs ONCE per request. Populates c.set("user"/"session")
// so downstream middleware and the oRPC context can read them directly,
// instead of every protected procedure re-issuing `auth.api.getSession({ headers })`.
// Per https://better-auth.com/docs/integrations/hono — section "Middleware (Session in Context)".
api.use("*", async (c, next) => {
  const data = await auth.api.getSession({ headers: c.req.raw.headers })
  c.set("user", data?.user ?? null)
  c.set("session", data?.session ?? null)
  await next()
})

// Health check
api.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }))

// Templates endpoint — moved to an oRPC procedure at /api/v1/rpc/templates/list.
// The CLI now calls it via @orpc/client instead of hitting a REST route.
// CLI version 2.0.0+ required (see packages/api/src/cli-version.ts).

// CLI version probe — public, no auth, low rate limit. The CLI calls this
// on startup to warn the user when their installed version is below
// CLI_MIN_SUPPORTED. Cached aggressively (10 minutes) because the values
// change only at release time.
api.get(
  "/cli-version",
  rateLimit(serverEnv.RATE_LIMIT_PER_MINUTE),
  (c) => {
    c.header("Cache-Control", "public, max-age=600, stale-while-revalidate=86400")
    return c.json({
      version: CLI_VERSION,
      minSupported: CLI_MIN_SUPPORTED,
    })
  },
)

api.get("/ready", async (c) => {
  try {
    // Ping Postgres before returning 200. db.execute throws on connection
    // failure (ECONNREFUSED, ETIMEDOUT, pool exhaustion), so the catch
    // returns 503 — the signal Kubernetes/LBs need to stop routing traffic.
    await db.execute(sql`SELECT 1`)
    return c.json({ status: "ready" })
  } catch {
    return c.json({ status: "not ready" }, 503)
  }
})

// Mount better-auth on /auth/*
api.on(["POST", "GET"], "/auth/*", (c) => {
  return auth.handler(c.req.raw)
})

// Mount oRPC on /rpc/* via `api.use(...)` + `await next()` so unmatched paths
// fall through to Hono's 404 instead of short-circuiting the chain.
// See https://orpc.dev/docs/adapters/hono.
const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [onError((error) => logger.error("orpc_error", error))],
})

api.use("/rpc/*", async (c, next) => {
  // Wrap c.req.raw in a Proxy that delegates body-parser methods to Hono's
  // parsed getters. Prevents the "Body Already Used" error if any middleware
  // (logger, rate limiter, etc.) reads the body before oRPC.
  const request = new Proxy(c.req.raw, {
    get(target, prop) {
      if (typeof prop === "string" && BODY_PARSER_METHODS.has(prop as BodyParserMethod)) {
        switch (prop) {
          case "arrayBuffer": return () => c.req.arrayBuffer()
          case "blob":        return () => c.req.blob()
          case "formData":    return () => c.req.formData()
          case "json":        return () => c.req.json()
          case "text":        return () => c.req.text()
        }
      }
      return Reflect.get(target, prop, target)
    },
  })

  const { matched, response } = await rpcHandler.handle(request, {
    prefix: "/rpc",
    context: {
      headers: c.req.raw.headers,
      user: c.get("user"),
      session: c.get("session"),
      requestId: c.get("requestId"),
    },
  })

  if (matched) {
    // Echo the requestId header on the oRPC response so clients can
    // correlate even when the response is constructed by oRPC internally.
    const headers = new Headers(response.headers)
    headers.set(REQUEST_ID_HEADER, c.get("requestId"))
    return c.newResponse(response.body, { ...response, headers })
  }

  await next()
})

// Not-found handler — uses the same stable error envelope as the global
// error handler so the client always sees { code, message, requestId }.
api.notFound((c) => {
  return c.json(errorBody(c, "not_found", "Route not found"), 404)
})

// Single export for the Next.js catch-all (uses `handle(api)` from hono/vercel).
export { api }

// Re-export types and router for client usage
export { appRouter } from "./router/index.js"
export type { AppRouter } from "./router/index.js"
