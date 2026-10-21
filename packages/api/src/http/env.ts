import type { Session, User } from "@workspace/auth"

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
 * `user` and `session` use the types exported by `@workspace/auth`,
 * which are inferred from the configured auth instance so a change in
 * the session schema flows through without a manual edit here. The
 * exported `Session` also carries the organization plugin's
 * `activeOrganizationId` field, which the organization procedures read
 * to report the caller's active organization.
 *
 * Do not augment Hono's `ContextVariableMap` globally. The
 * per-app `Variables` generic is enough; global augmentation
 * is explicitly discouraged by the Hono docs because it lies
 * to contexts where the setting middleware never ran.
 */
export type ApiEnv = {
  Variables: {
    requestId: string
    user: User | null
    session: Session | null
  }
}
