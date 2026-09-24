import type { MiddlewareHandler } from "hono";
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
export declare const session: () => MiddlewareHandler;
//# sourceMappingURL=session.d.ts.map