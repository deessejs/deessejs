import type { Session, User } from "better-auth";
export interface BaseContext {
    headers: Headers;
    user: User | null;
    session: Session | null;
    /** Per-request correlation ID, set by the X-Request-Id middleware. */
    requestId: string;
}
//# sourceMappingURL=base-context.d.ts.map