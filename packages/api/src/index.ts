import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger as honoLogger } from "hono/logger"
import { secureHeaders } from "hono/secure-headers"
import { serverEnv } from "@workspace/env/server"
import { API_BASE_PATH, API_RPC_PATH } from "./constants/base-path.js"
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
api.use(
  "*",
  cors({ origin: serverEnv.ALLOWED_ORIGINS, credentials: true }),
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
export { API_RPC_PATH }
