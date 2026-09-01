import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger as honoLogger } from "hono/logger"
import { secureHeaders } from "hono/secure-headers"
import { serverEnv } from "@workspace/env/server"
import { isHostAllowed } from "@workspace/auth/host-allowlist"
import { API_BASE_PATH, API_RPC_PATH, API_AUTH_PATH } from "./constants/base-path.js"
import { logger } from "./constants/logger.js"
import {
  onError as onApiError,
  requestId,
  session,
  type ApiEnv,
  mountHttp,
  mountRpc,
} from "./http/index.js"
import { appRouter, type AppRouter } from "./orpc/index.js"

const api = new Hono<ApiEnv>().basePath(API_BASE_PATH)

api.onError(onApiError)
api.use("*", requestId())
api.use("*", secureHeaders())
// CORS allowlist — same shape as better-auth's `allowedHosts` via
// `@workspace/auth/host-allowlist`. The function form echoes the
// requesting `Origin` header when the host is permitted (required
// because `credentials: true` forbids the wildcard
// `Access-Control-Allow-Origin: *` response — see ADR-028 Context §8).
// `ALLOWED_ORIGINS` adds ad-hoc staging / partner origins on top.
api.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return origin
      try {
        const host = new URL(origin).host
        if (isHostAllowed(host)) return origin
      } catch {
        // fall through
      }
      const adHoc = serverEnv.ALLOWED_ORIGINS
      if (adHoc.includes(origin)) return origin
      return null
    },
    credentials: true,
  }),
)
api.use("*", honoLogger())
api.use("*", session())

mountHttp(api)
mountRpc(api)

api.notFound((c) => {
  const body: {
    defined: false
    code: "NOT_FOUND"
    message: string
    requestId?: string
  } = {
    defined: false,
    code: "NOT_FOUND",
    message: "Route not found",
  }
  const requestId = c.get("requestId")
  if (requestId !== undefined) body.requestId = requestId
  return c.json(body, 404)
})

void logger // re-exported for downstream consumers if needed

export { api }
export { appRouter, type AppRouter }
export { API_RPC_PATH, API_AUTH_PATH, API_BASE_PATH }
