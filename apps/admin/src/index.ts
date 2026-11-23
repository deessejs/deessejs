import { admin as betterAuthAdmin } from "better-auth/plugins"
import {
  plugin,
  type NoArgsRegistration,
  type PluginContribution,
} from "deesse"

const definition: { id: "admin"; handler: () => PluginContribution } = {
  id: "admin",
  handler: () => ({ auth: { serverPlugins: [betterAuthAdmin()] } }),
}

export const admin: (() => NoArgsRegistration<typeof definition>) & {
  definition: typeof definition
} = plugin(definition)
