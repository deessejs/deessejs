import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger as honoLogger } from "hono/logger"
import { secureHeaders } from "hono/secure-headers"
import { serverEnv } from "@workspace/env/server"
import { API_BASE_PATH } from "./constants/base-path.js"
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

void logger // re-exported for downstream consumers if needed

export { api }
export { appRouter, type AppRouter }
