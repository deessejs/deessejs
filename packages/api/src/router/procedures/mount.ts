import { onError } from "@orpc/server"
import { RPCHandler } from "@orpc/server/fetch"
import type { Hono } from "hono"
import { logger } from "../../logger.js"
import { REQUEST_ID_HEADER } from "../../middleware/request-id.js"
import type { ApiEnv } from "../../types/api-env.js"
import { appRouter } from "../routes/index.js"
import { wrapForOrpc } from "./hono-adapter.js"

/**
 * Mount the oRPC handler on `/rpc/*`.
 *
 * `api.use(...)` + `await next()` keeps unmatched paths flowing
 * down the chain instead of short-circuiting. See
 * https://orpc.dev/docs/adapters/hono.
 *
 * The matched response is rewritten to carry the request ID
 * header, so clients can correlate even when oRPC constructs
 * the response internally.
 */
export const mountRpc = (api: Hono<ApiEnv>): void => {
  const rpcHandler = new RPCHandler(appRouter, {
    interceptors: [onError((error) => logger.error("orpc_error", error))],
  })

  api.use("/rpc/*", async (c, next) => {
    const request = wrapForOrpc(c)
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
      const headers = new Headers(response.headers)
      headers.set(REQUEST_ID_HEADER, c.get("requestId"))
      return c.newResponse(response.body, { ...response, headers })
    }

    await next()
  })
}
