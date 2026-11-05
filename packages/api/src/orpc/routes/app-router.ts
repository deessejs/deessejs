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
import { organizationBlocksRouter } from "./organization-blocks.js"
import { adminBlockPublicationsRouter } from "./admin-block-publications.js"
import { adminBlocksRouter } from "./admin-blocks.js"
import { blocksRouter } from "./blocks.js"

export const appRouter = {
  blocks: blocksRouter,
  templates: templatesRouter,
  admin: {
    blocks: adminBlocksRouter,
    templates: {
      ...adminTemplatesRouter,
      publications: adminTemplatePublicationsRouter,
      blockPublications: adminBlockPublicationsRouter,
      image: adminTemplateImageRouter,
    },
  },
  organization: {
    ...organizationRouter,
    avatar: organizationAvatarRouter,
    templates: organizationTemplatesRouter,
    blocks: organizationBlocksRouter,
    templateImages: organizationTemplateImageRouter,
  },
  profile: { avatar: profileAvatarRouter },
  githubApp: githubAppRouter,
  playbook: playbookRouter,
}

export type AppRouter = typeof appRouter
