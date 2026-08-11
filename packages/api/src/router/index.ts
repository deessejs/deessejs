import { userRouter } from "./routes/user.js"
import { templatesRouter } from "./routes/templates.js"

export const appRouter = {
  user: userRouter,
  templates: templatesRouter,
}

// Type export for client usage
export type AppRouter = typeof appRouter
