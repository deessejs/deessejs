import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger as honoLogger } from "hono/logger"
import { secureHeaders } from "hono/secure-headers"
import { serverEnv } from "@workspace/env/server"
import "./hono-augment.js"
import { API_BASE_PATH } from "./base-path.js"
import { onError as onApiError } from "./middleware/error-handler.js"
import { requestId } from "./middleware/request-id.js"
import { session } from "./middleware/session.js"
import { mountHttp } from "./router/routes/http.js"
import { mountRpc } from "./router/procedures/mount.js"
import type { ApiEnv } from "./types/api-env.js"

// Catch-all is mounted at /api/[[...route]] in
// apps/app/app/api/[[...route]]/route.ts, so all incoming requests
// have an /api prefix. `API_BASE_PATH` (from ./base-path.js) is the
// single source of truth — Hono routes below are registered
// *relative* to it (e.g. `/health` matches `/api/v1/health`).
const api = new Hono<ApiEnv>().basePath(API_BASE_PATH)

// Global error handler — runs first so any error from a downstream
// handler is funnelled into a stable JSON envelope.
api.onError(onApiError)

// Request ID — generates a fresh UUID per request (or honours the
// incoming `X-Request-Id` for cross-system correlation), stores it
// in c.var.requestId, and echoes it on the response.
api.use("*", requestId())

// Security headers — HSTS, nosniff, Referrer-Policy, X-Frame-Options,
// sensible default CSP. Cheap hardening, applied to every response.
api.use("*", secureHeaders())

// CORS — single source of truth, validated at the env-package boundary.
api.use(
  "*",
  cors({ origin: serverEnv.ALLOWED_ORIGINS, credentials: true }),
)

// Logging — Hono's default short logger, augmented by the
// structured logger in the error handler.
api.use("*", honoLogger())

// Session — populates c.var.user / c.var.session once per request.
api.use("*", session())

// Direct HTTP routes (health, cli-version, ready, auth) and oRPC
// mount are factored out so the composer stays small and the
// adapters are testable in isolation.
mountHttp(api)
mountRpc(api)

// Not-found handler. api.notFound runs after every other route
// and middleware has been tried and nothing matched, so it
// cannot accidentally short-circuit a working path the way
// `api.use("/*", ...)` did.
api.notFound((c) =>
  c.json(
    {
      defined: false,
      code: "NOT_FOUND",
      status: 404,
      message: "Route not found",
      data: {},
    },
    404,
  ),
)

// Single export for the Next.js catch-all (uses `handle(api)` from hono/vercel).
export { api }

// Re-export types and router for client usage
export { appRouter } from "./router/index.js"
export type { AppRouter } from "./router/index.js"
