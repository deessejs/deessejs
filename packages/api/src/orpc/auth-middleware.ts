import { ORPCError } from "@orpc/server"
import { base } from "./base.js"

// Auth guard — `user` and `session` are populated by the Hono session
// middleware (see packages/api/src/http/middleware/session.ts), so we only
// need to verify they are present and forward them through.
export const authGuard = base.middleware(async ({ context, next }) => {
  if (!context.user || !context.session) {
    throw new ORPCError("UNAUTHORIZED")
  }

  return next({
    context: {
      ...context,
      user: context.user,
      session: context.session,
    },
  })
})