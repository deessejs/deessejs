import type { auth } from "@workspace/auth"

/**
 * Hono environment shared by the API app.
 *
 * Single source of truth for `c.var.*` typing. The Hono global
 * `ContextVariableMap` augmentation in `hono-augment.d.ts` derives
 * from this type, so adding a variable here propagates everywhere.
 *
 * Populated by:
 *   - `middleware/request-id.ts` (requestId)
 *   - `middleware/session.ts`   (user, session)
 */
export type ApiEnv = {
  Variables: {
    requestId: string
    user: NonNullable<
      Awaited<ReturnType<typeof auth.api.getSession>>
    >["user"] | null
    session: NonNullable<
      Awaited<ReturnType<typeof auth.api.getSession>>
    >["session"] | null
  }
}
