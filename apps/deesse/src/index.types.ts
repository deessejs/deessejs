import type { PluginContribution, PluginDefinition, PluginRegistration, ZodType } from "./types.js"

export type Definition<
  TSchema extends ZodType,
  TContribution extends PluginContribution,
  TRequires extends readonly string[],
  TPoints extends Readonly<Record<string, unknown>>,
> = PluginDefinition<TSchema, TContribution, TRequires, TPoints>

export type NoArgsRegistration<TDefinition extends { id: string; handler: () => PluginContribution }> = {
  id: TDefinition["id"]
  definition: TDefinition
}

export type ConfiguredRegistration<TDefinition extends { id: string; args: ZodType; handler: (...args: never[]) => unknown }> = PluginRegistration<TDefinition>
