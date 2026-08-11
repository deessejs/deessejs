import { templatesRouter } from "./routes/templates.js"

export const appRouter = {
  templates: templatesRouter,
}

// Type export for client usage
export type AppRouter = typeof appRouter
