import { organizationRouter } from "./organization.js"
import { templatesRouter } from "./templates.js"
import { playbookRouter } from "./playbook.js"
import { adminTemplatesRouter } from "./admin-templates.js"
import { githubAppRouter } from "./github-app.js"
import { organizationTemplatesRouter } from "./organization-templates.js"
import { adminTemplatePublicationsRouter } from "./admin-template-publications.js"
import { organizationAvatarRouter, profileAvatarRouter } from "./avatars.js"
import {
  organizationTemplateImageRouter,
  adminTemplateImageRouter,
} from "./template-images.js"

export const appRouter = {
  templates: templatesRouter,
  admin: {
    templates: {
      ...adminTemplatesRouter,
      publications: adminTemplatePublicationsRouter,
      image: adminTemplateImageRouter,
    },
  },
  organization: {
    ...organizationRouter,
    avatar: organizationAvatarRouter,
    templates: organizationTemplatesRouter,
    templateImages: organizationTemplateImageRouter,
  },
  profile: { avatar: profileAvatarRouter },
  githubApp: githubAppRouter,
  playbook: playbookRouter,
}

export type AppRouter = typeof appRouter
