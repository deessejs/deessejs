import { templatesRouter } from "./templates.js"

export const appRouter = {
  templates: templatesRouter,
}

export type AppRouter = typeof appRouter
