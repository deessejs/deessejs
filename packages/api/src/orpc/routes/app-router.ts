import { organizationRouter } from "./organization.js"
import { templatesRouter } from "./templates.js"
import { playbookRouter } from "./playbook.js"
import { adminTemplatesRouter } from "./admin-templates.js"

export const appRouter = {
  templates: templatesRouter,
  admin: { templates: adminTemplatesRouter },
  organization: organizationRouter,
  playbook: playbookRouter,
}

export type AppRouter = typeof appRouter
