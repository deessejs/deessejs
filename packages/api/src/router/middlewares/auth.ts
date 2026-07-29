import { ORPCError } from "@orpc/server"
import { base } from "../context.js"
import type { AuthContext } from "../context.js"

// Auth guard — `user` and `session` are populated by the Hono session
// middleware (see packages/api/src/index.ts), so we only need to verify
// they're present and forward them through.
export const authMiddleware = base.middleware(async ({ context, next }) => {
  if (!context.user || !context.session) {
    throw new ORPCError("UNAUTHORIZED")
  }

  return next({
    context: {
      ...context,
      user: context.user,
      session: context.session,
    } as AuthContext,
  })
})