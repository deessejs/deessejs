import { randomUUID } from "node:crypto"
import type { MiddlewareHandler } from "hono"

/**
 * X-Request-Id middleware.
 *
 * If the incoming request carries an `X-Request-Id` header that matches
 * the safe whitelist, propagate it (caller-supplied ID for cross-system
 * correlation). Otherwise mint a fresh UUID. The chosen ID is:
 *   - stored in `c.var.requestId` for downstream handlers
 *   - echoed back as the `X-Request-Id` response header so the client can
 *     log it and quote it in support tickets
 *
 * Whitelist rationale: the value is reflected verbatim into the response
 * header, the JSON error body (`{ code, message, requestId }`), and the
 * server-side structured log line. Accepting arbitrary input creates three
 * concrete attack surfaces:
 *   1. Header injection / CRLF smuggling if a runtime ever lets a `\r\n`
 *      through into a downstream header.
 *   2. Log injection in JSON-lines aggregators that split on `\n` and
 *      parse each line as JSON; an embedded quote/brace sequence is
 *      JSON-escaped by `JSON.stringify`, but a long ID can still break
 *      length assumptions in the aggregator.
 *   3. Reflected content in any future UI surface that displays the ID.
 * Restricting to URL-safe characters that match common request-id formats
 * (UUIDs, ulids, AWS X-Amzn-Trace-Id, Cloudflare Cf-Ray) keeps legitimate
 * use cases working while closing those vectors.
 *
 * The oRPC `RPCHandler` context picks the value up via `c.get('requestId')`
 * and threads it into the procedure context, where error logging and the
 * structured logger can attach it to every emitted line.
 */
export const REQUEST_ID_HEADER = "X-Request-Id"

const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,128}$/

const sanitize = (raw: string | undefined): string | null => {
  if (!raw) return null
  return SAFE_REQUEST_ID.test(raw) ? raw : null
}

export const requestId = (): MiddlewareHandler => {
  return async (c, next) => {
    const incoming = sanitize(c.req.header(REQUEST_ID_HEADER))
    const id = incoming ?? randomUUID()
    c.set("requestId", id)
    c.header(REQUEST_ID_HEADER, id)
    await next()
  }
}
