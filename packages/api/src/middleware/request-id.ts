import { randomUUID } from "node:crypto"
import type { MiddlewareHandler } from "hono"

/**
 * X-Request-Id middleware.
 *
 * If the incoming request carries an `X-Request-Id` header, propagate it
 * (caller-supplied ID for cross-system correlation). Otherwise mint a
 * fresh UUID. The chosen ID is:
 *   - stored in `c.var.requestId` for downstream handlers
 *   - echoed back as the `X-Request-Id` response header so the client can
 *     log it and quote it in support tickets
 *
 * The oRPC `RPCHandler` context picks the value up via `c.get('requestId')`
 * and threads it into the procedure context, where error logging and the
 * structured logger can attach it to every emitted line.
 */
export const REQUEST_ID_HEADER = "X-Request-Id"

export const requestId = (): MiddlewareHandler => {
  return async (c, next) => {
    const incoming = c.req.header(REQUEST_ID_HEADER)
    const id = incoming && incoming.length > 0 ? incoming : randomUUID()
    c.set("requestId", id)
    c.header(REQUEST_ID_HEADER, id)
    await next()
  }
}
