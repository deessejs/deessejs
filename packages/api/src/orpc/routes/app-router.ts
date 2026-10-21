import { organizationRouter } from "./organization.js"
import { templatesRouter } from "./templates.js"
import { playbookRouter } from "./playbook.js"

export const appRouter = {
  templates: templatesRouter,
  organization: organizationRouter,
  playbook: playbookRouter,
}

export type AppRouter = typeof appRouter
