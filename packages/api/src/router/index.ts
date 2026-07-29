import { userRouter } from "./user.js"

export const appRouter = {
  user: userRouter,
}

// Type export for client usage
export type AppRouter = typeof appRouter
