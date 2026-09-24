import type { Context } from "hono";
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
export declare const onError: (err: Error, c: Context) => Response;
//# sourceMappingURL=error-handler.d.ts.map