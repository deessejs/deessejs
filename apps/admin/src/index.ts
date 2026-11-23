import { admin as betterAuthAdmin } from "better-auth/plugins"
import type { ComponentType } from "react"
import {
  plugin,
  type DeesseAdminPageContext,
  type PluginContribution,
  type NoArgsRegistration,
} from "deesse"
import { AdminOverview } from "./overview.js"

export type AdminPageDefinition = {
  path: string
  title: string
  component: ComponentType
  group?: string
  order?: number
  authorize?: (context: DeesseAdminPageContext) => "allow" | "unauthenticated" | "forbidden" | Promise<"allow" | "unauthenticated" | "forbidden">
}

export function adminPage<TPage extends AdminPageDefinition>(page: TPage): TPage {
  return page
}

const definition: { id: "admin"; handler: () => PluginContribution } = {
  id: "admin",
  handler: () => ({
    auth: { serverPlugins: [betterAuthAdmin()] },
    admin: {
      pages: [adminPage({ path: "/", title: "Overview", component: AdminOverview })],
    },
  }),
} as const

export const admin: (() => NoArgsRegistration<typeof definition>) & { definition: typeof definition } = plugin(definition)
