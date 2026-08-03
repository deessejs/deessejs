import { os } from "@orpc/server"
import type { Session, User } from "better-auth"

// Context populated by the Hono session middleware in packages/api/src/index.ts.
// `user` and `session` are `null` (not undefined) when unauthenticated — this
// keeps the shape predictable for downstream consumers.
export interface BaseContext {
  headers: Headers
  user: User | null
  session: Session | null
  /** Per-request correlation ID, set by the X-Request-Id middleware. */
  requestId: string
}

// Auth context — non-null assertions on user and session, available to
// procedures that go through `authMiddleware`.
export interface AuthContext extends BaseContext {
  session: Session
  user: User
}

// Base procedure with shared context
export const base = os.$context<BaseContext>()