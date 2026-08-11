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
    },
    404,
  ),
)

export { api }
export { appRouter } from "./router/index.js"
export type { AppRouter } from "./router/index.js"
