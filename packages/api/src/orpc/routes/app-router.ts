import { organizationRouter } from "./organization.js"
import { templatesRouter } from "./templates.js"

export const appRouter = {
  templates: templatesRouter,
  organization: organizationRouter,
}

export type AppRouter = typeof appRouter
