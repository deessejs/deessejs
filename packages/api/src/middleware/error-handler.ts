import type { Context } from "hono"
import { HTTPException } from "hono/http-exception"
import { logger } from "../logger.js"

/**
 * Wire shape for every error response, regardless of where the error
 * originated. Matches the JSON shape `@orpc/client` decodes into a real
 * `ORPCError` instance:
 *
 *   { defined: boolean, code: string, status: number, message: string, data: unknown }
 *
 * `defined: true` is reserved for errors thrown from oRPC procedures
 * via the typed error map (`base.errors.NOT_FOUND()` etc.). Hono-level
 * errors (rate-limit, 404 fallback, unhandled throws) emit `defined: false`
 * because the client did not register them — the client still surfaces
 * them as `ORPCError`, but the code is treated as ad-hoc.
 */
const orpcErrorBody = (
  code: string,
  status: number,
  message: string,
  data: unknown = {},
  defined = false,
): string =>
  JSON.stringify({ defined, code, status, message, data })

/**
 * Global error handler for the Hono app.
 *
 * Produces a wire-compatible ORPCError shape so the typed client
 * (`@orpc/client`) decodes every error path the same way, including
 * Hono-level middleware (rate-limit, 404 fallback) that runs outside
 * the `/rpc/*` oRPC handler.
 *
 * The full stack is logged server-side with the requestId for support
 * to find, but is never returned to the client (no stack leak in prod).
 *
 * - HTTPException (thrown by Hono or our middleware) is mapped to its
 *   status code and a code derived from the status.
 * - Any other error becomes 500 / "internal_error" with a generic
 *   message in prod; the underlying message is preserved in the server log.
 */
export const onError = (err: Error, c: Context): Response => {
  const requestId = c.get("requestId") ?? "unknown"
  const isProd = process.env.NODE_ENV === "production"

  if (err instanceof HTTPException) {
    const status = err.status
    const code = httpStatusToCode(status)
    logger.warn("http_exception", {
      requestId,
      method: c.req.method,
      path: c.req.path,
      status,
      err: { name: err.name, message: err.message },
    })
    return new Response(orpcErrorBody(code, status, err.message || code), {
      status,
      headers: { "content-type": "application/json" },
    })
  }

  logger.error("unhandled_error", err, {
    requestId,
    method: c.req.method,
    path: c.req.path,
  })
  return new Response(
    orpcErrorBody(
      "INTERNAL_SERVER_ERROR",
      500,
      isProd ? "An unexpected error occurred" : err.message,
    ),
    {
      status: 500,
      headers: { "content-type": "application/json" },
    },
  )
}

const httpStatusToCode = (status: number): string => {
  switch (status) {
    case 400:
      return "BAD_REQUEST"
    case 401:
      return "UNAUTHORIZED"
    case 403:
      return "FORBIDDEN"
    case 404:
      return "NOT_FOUND"
    case 405:
      return "METHOD_NOT_SUPPORTED"
    case 409:
      return "CONFLICT"
    case 422:
      return "UNPROCESSABLE_ENTITY"
    case 429:
      return "RATE_LIMITED"
    default:
      return status >= 500 ? "INTERNAL_SERVER_ERROR" : "ERROR"
  }
}
