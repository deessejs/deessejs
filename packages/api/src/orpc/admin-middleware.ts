import { ORPCError } from "@orpc/server"
import { base } from "./base.js"
import { authGuard } from "./auth-middleware.js"

/** Authenticated procedures reserved for global administrators. */
export const adminProcedure = base
  .use(authGuard)
  .use(async ({ context, next }) => {
    if (context.user.role !== "admin") {
      throw new ORPCError("FORBIDDEN")
    }

    return next()
  })
