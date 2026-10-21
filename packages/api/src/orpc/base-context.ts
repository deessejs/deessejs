import type { Session, User } from "@workspace/auth"

// Context populated by the Hono session middleware in packages/api/src/index.ts.
// `user` and `session` are `null` (not undefined) when unauthenticated — this
// keeps the shape predictable for downstream consumers.
//
// The types come from `@workspace/auth` rather than from `better-auth`,
// because the exported `Session` carries the organization plugin's
// `activeOrganizationId` field, which the organization procedures read.
// The raw `better-auth` types do not have it, so a procedure that read
// the session from them would not compile.
export interface BaseContext {
  headers: Headers
  user: User | null
  session: Session | null
  /** Per-request correlation ID, set by the X-Request-Id middleware. */
  requestId: string
}
