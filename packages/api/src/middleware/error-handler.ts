import type { Context } from "hono"
import { HTTPException } from "hono/http-exception"
import { logger } from "../logger.js"
import { errorBody, readRequestId } from "../envelope.js"

/**
 * Global error handler for the Hono app.
 *
 * Returns a stable JSON envelope for every unhandled error via the
 * shared `errorBody()` helper. The full stack is logged server-side
 * with the requestId so support can find it, but is never returned
 * to the client (no stack leak in prod).
 *
 * - HTTPException (thrown by Hono) is mapped to its status code and a
 *   code derived from the status.
 * - Any other error becomes 500 / "internal_error" with a generic message
 *   in prod; the underlying message is preserved in the server log.
 */
export const onError = (err: Error, c: Context): Response => {
  const requestId = readRequestId(c)
  const isProd = process.env.NODE_ENV === "production"

  if (err instanceof HTTPException) {
    const status = err.status
    const code = httpStatusToCode(status)
    const body = errorBody(c, code, err.message || code)
    logger.warn("http_exception", {
      requestId,
      method: c.req.method,
      path: c.req.path,
      status,
      err: { name: err.name, message: err.message },
    })
    return c.json(body, status as 400)
  }

  const body = errorBody(
    c,
    "internal_error",
    isProd ? "An unexpected error occurred" : err.message,
  )
  logger.error("unhandled_error", err, {
    requestId,
    method: c.req.method,
    path: c.req.path,
  })
  return c.json(body, 500)
}

const httpStatusToCode = (status: number): string => {
  switch (status) {
    case 400:
      return "bad_request"
    case 401:
      return "unauthorized"
    case 403:
      return "forbidden"
    case 404:
      return "not_found"
    case 405:
      return "method_not_allowed"
    case 409:
      return "conflict"
    case 422:
      return "unprocessable_entity"
    case 429:
      return "rate_limited"
    default:
      return status >= 500 ? "internal_error" : "error"
  }
}
