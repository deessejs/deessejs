import { organizationRouter } from "./organization.js"
import { templatesRouter } from "./templates.js"
import { playbookRouter } from "./playbook.js"
import { adminTemplatesRouter } from "./admin-templates.js"
import { githubAppRouter } from "./github-app.js"

export const appRouter = {
  templates: templatesRouter,
  admin: { templates: adminTemplatesRouter },
  organization: organizationRouter,
  githubApp: githubAppRouter,
  playbook: playbookRouter,
}

export type AppRouter = typeof appRouter
