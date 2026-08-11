import type { MiddlewareHandler } from "hono"
import { auth } from "@workspace/auth"

/**
 * Better Auth session middleware.
 *
 * Runs ONCE per request. Populates `c.var.user` and `c.var.session`
 * so downstream middleware and oRPC procedures can read them
 * directly, instead of every protected procedure re-issuing
 * `auth.api.getSession({ headers })`.
 *
 * Per https://better-auth.com/docs/integrations/hono — section
 * "Middleware (Session in Context)".
 *
 * `user` and `session` are `null` (not `undefined`) when the
 * request is unauthenticated — this keeps the shape predictable
 * for downstream consumers.
 */
export const session = (): MiddlewareHandler => async (c, next) => {
  const data = await auth.api.getSession({ headers: c.req.raw.headers })
  c.set("user", data?.user ?? null)
  c.set("session", data?.session ?? null)
  await next()
}
