import { onError } from "@orpc/server"
import { RPCHandler } from "@orpc/server/fetch"
import type { Hono } from "hono"
import { API_BASE_PATH } from "../constants/base-path.js"
import { logger } from "../constants/logger.js"
import { appRouter } from "../orpc/routes/app-router.js"
import { wrapForOrpc } from "./hono-adapter.js"
import { REQUEST_ID_HEADER } from "./middleware/request-id.js"
import type { ApiEnv } from "./env.js"

/**
 * Mount the oRPC handler on `/rpc/*`.
 *
 * `api.use(...)` + `await next()` keeps unmatched paths flowing
 * down the chain instead of short-circuiting. See
 * https://orpc.dev/docs/adapters/hono.
 *
 * Per Hono's docs (https://hono.dev/docs/api/routing), the
 * trailing wildcard `*` is a *special* wildcard that matches
 * any number of path segments: `/rpc/*` matches `/rpc/x`,
 * `/rpc/x/y`, and `/rpc/x/y/z`. The bare pattern is therefore
 * sufficient for any oRPC procedure path, regardless of
 * segment count.
 *
 * The `prefix` passed to `rpcHandler.handle` is the URL
 * prefix the oRPC handler matches against the request
 * pathname. Because the Hono app is built with
 * `basePath("/api/v1")`, the actual request URL Hono sees
 * is `/api/v1/rpc/...`. The prefix must include the
 * basePath: `API_BASE_PATH + "/rpc"` (= `/api/v1/rpc`).
 * Passing only `/rpc` makes the oRPC `StandardHandler.handle`
 * check fail on every request — the path does not start with
 * `/rpc/`. ADR-015 documents the prefix-alignment invariant.
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
      prefix: `${API_BASE_PATH}/rpc`,
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
