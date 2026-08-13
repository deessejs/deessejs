import type { AuthInstance } from "@workspace/auth"

/**
 * Hono environment shared by the API app.
 *
 * Single source of truth for `c.var.*` typing. Adding a variable
 * here propagates through `new Hono<ApiEnv>()` everywhere the app
 * is composed.
 *
 * Populated by:
 *   - `middleware/request-id.ts` (requestId)
 *   - `middleware/session.ts`   (user, session)
 *
 * `user` and `session` use the official better-auth pattern
 * `AuthInstance["$Infer"]["Session"]["user"]` — see
 * https://better-auth.com/docs/integrations/hono. The shape is
 * derived from the auth instance config, so a change in the
 * session schema flows through without a manual edit here.
 *
 * Do not augment Hono's `ContextVariableMap` globally. The
 * per-app `Variables` generic is enough; global augmentation
 * is explicitly discouraged by the Hono docs because it lies
 * to contexts where the setting middleware never ran.
 */
export type ApiEnv = {
  Variables: {
    requestId: string
    user: AuthInstance["$Infer"]["Session"]["user"] | null
    session: AuthInstance["$Infer"]["Session"]["session"] | null
  }
}
