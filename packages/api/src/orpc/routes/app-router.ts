import { organizationRouter } from "./organization.js"
import { templatesRouter } from "./templates.js"
import { playbookRouter } from "./playbook.js"
import { adminTemplatesRouter } from "./admin-templates.js"
import { githubAppRouter } from "./github-app.js"
import { organizationTemplatesRouter } from "./organization-templates.js"

export const appRouter = {
  templates: templatesRouter,
  admin: { templates: adminTemplatesRouter },
  organization: {
    ...organizationRouter,
    templates: organizationTemplatesRouter,
  },
  githubApp: githubAppRouter,
  playbook: playbookRouter,
}

export type AppRouter = typeof appRouter
