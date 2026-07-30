import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { sql } from "drizzle-orm"
import { auth } from "@workspace/auth"
import { onError } from "@orpc/server"
import { RPCHandler } from "@orpc/server/fetch"
import { db } from "@workspace/database"
import { serverEnv } from "@workspace/env/server"
import { appRouter } from "./router/index.js"
import { API_BASE_PATH } from "./base-path.js"
import { TEMPLATES } from "./templates.js"

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
// (e.g. `/health` matches `/api/health`). Renaming the prefix means editing
// API_BASE_PATH in base-path.ts and moving the Next.js catch-all directory.
const api = new Hono<ApiEnv>().basePath(API_BASE_PATH)

// CORS middleware (single source of truth, validated at the env-package boundary)
api.use(
  "*",
  cors({ origin: serverEnv.ALLOWED_ORIGINS, credentials: true }),
)

// Logging middleware
api.use("*", logger())

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

// Templates endpoint — consumed by the @deessejs/cli (list / info / init).
// Public for V1 (the CLI has no auth tokens yet). V1.1 (device auth) can
// gate this behind the authMiddleware without breaking the response shape.
api.get("/templates", (c) => c.json({ templates: TEMPLATES }))
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
  interceptors: [onError((error) => console.error("[oRPC]", error))],
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
    },
  })

  if (matched) {
    return c.newResponse(response.body, response)
  }

  await next()
})

// Single export for the Next.js catch-all (uses `handle(api)` from hono/vercel).
export { api }

// Re-export types and router for client usage
export { appRouter } from "./router/index.js"
export type { AppRouter } from "./router/index.js"