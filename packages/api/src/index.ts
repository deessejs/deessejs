import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger as honoLogger } from "hono/logger"
import { secureHeaders } from "hono/secure-headers"
import { serverEnv } from "@workspace/env/server"
import { API_BASE_PATH } from "./base-path.js"
import {
  onError as onApiError,
  requestId,
  session,
} from "./middleware/index.js"
import { mountRpc, mountHttp, appRouter, type AppRouter } from "./router/index.js"
import type { ApiEnv } from "./types/api-env.js"

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

api.notFound((c) =>
  c.json(
    {
      defined: false,
      code: "NOT_FOUND",
      status: 404,
      message: "Route not found",
      data: {},
      requestId: c.get("requestId"),
    },
    404,
  ),
)

export { api }
export { appRouter, type AppRouter }
