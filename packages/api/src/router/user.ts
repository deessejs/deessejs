import { z } from "zod"
import { base } from "./context.js"
import { authMiddleware } from "./middlewares/auth.js"

// Public procedures (no auth)
export const listUsers = base
  .input(
    z.object({
      limit: z.number().int().min(1).max(100).optional().default(10),
      offset: z.number().int().min(0).optional().default(0),
    }),
  )
  .handler(async () => {
    // TODO: Implement with @workspace/database
    return [{ id: "1", name: "User", email: "user@example.com" }]
  })

// Protected procedures (with auth)
const protectedBase = base.use(authMiddleware)

export const findUser = protectedBase
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    // TODO: Implement with @workspace/database
    return { id: input.id, name: "User", email: "user@example.com" }
  })

export const createUser = protectedBase
  .input(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
    }),
  )
  .handler(async ({ input }) => {
    // TODO: Implement with @workspace/database
    return { id: crypto.randomUUID(), ...input }
  })

export const getProfile = protectedBase.handler(async ({ context }) => {
  return context.user
})

// Router
export const userRouter = {
  list: listUsers,
  find: findUser,
  create: createUser,
  profile: getProfile,
}
