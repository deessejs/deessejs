import { templatesRouter } from "./templates.js"
import { playbookRouter } from "./playbook.js"

export const appRouter = {
  templates: templatesRouter,
  playbook: playbookRouter,
}

export type AppRouter = typeof appRouter
