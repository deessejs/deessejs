import { userRouter } from "./user.js"
import { templatesRouter } from "./templates.js"

export const appRouter = {
  user: userRouter,
  templates: templatesRouter,
}

// Type export for client usage
export type AppRouter = typeof appRouter
