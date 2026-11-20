import type { DeesseDatabaseSchema, PluginContribution } from "deesse"

export type CliPlugin = {
  id: string
  args?: unknown
  definition: {
    requires?: readonly string[]
    handler: (...args: unknown[]) => PluginContribution
  }
}

export type CliDatabaseSchema = DeesseDatabaseSchema
