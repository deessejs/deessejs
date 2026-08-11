import type { Session, User } from "better-auth"
import type { BaseContext } from "./base-context.js"

// Auth context — non-null assertions on user and session, available to
// procedures that go through `authGuard`.
export interface AuthContext extends BaseContext {
  session: Session
  user: User
}
